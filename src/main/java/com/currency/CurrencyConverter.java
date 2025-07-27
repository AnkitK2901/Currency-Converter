package com.currency;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.math.BigDecimal;
import java.math.RoundingMode;

public class CurrencyConverter {

    // --- CONFIGURATION ---
    private static final int SERVER_PORT = 8080;
    // Your App ID from openexchangerates.org
    private static final String APP_ID = "3620f92c5c89408d955659bc11aa6bdf";
    // CORRECTED API URL for openexchangerates.org
    private static final String API_URL = "https://openexchangerates.org/api/latest.json?app_id=" + APP_ID;
    private static final Gson gson = new Gson();

    private static void handleCurrencyListRequest(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendResponse(exchange, 405, "Method Not Allowed");
            return;
        }

        try {
            // Fetch currency names
            URL url = new URL("https://openexchangerates.org/api/currencies.json?app_id=" + APP_ID);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            if (conn.getResponseCode() != 200) {
                String errorBody = new Scanner(conn.getErrorStream()).useDelimiter("\\A").next();
                sendResponse(exchange, 502, "{\"error\":\"Failed to fetch currency list: " + errorBody + "\"}");
                return;
            }

            String responseBody = new Scanner(conn.getInputStream()).useDelimiter("\\A").next();

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            sendResponse(exchange, 200, responseBody);

        } catch (IOException e) {
            e.printStackTrace();
            sendResponse(exchange, 502, "{\"error\":\"Error connecting to currency list API.\"}");
        }
    }

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(SERVER_PORT), 0);
        server.createContext("/api/currencies", CurrencyConverter::handleCurrencyListRequest);
        server.createContext("/api/convert", CurrencyConverter::handleConversionRequest);
        server.createContext("/", CurrencyConverter::serveStaticFiles);
        server.setExecutor(null);
        server.start();
        System.out.println("✅ Server started on port " + SERVER_PORT);
        System.out.println("Access the application at http://localhost:" + SERVER_PORT);
    }

    private static void handleConversionRequest(HttpExchange exchange) throws IOException {
        if (!"GET".equals(exchange.getRequestMethod())) {
            sendResponse(exchange, 405, "Method Not Allowed");
            return;
        }

        Map<String, String> params = queryToMap(exchange.getRequestURI().getQuery());
        String fromCurrency = params.get("from");
        String toCurrency = params.get("to");
        String amountStr = params.get("amount");

        if (fromCurrency == null || toCurrency == null || amountStr == null) {
            sendResponse(exchange, 400, "{\"error\":\"Missing required parameters: from, to, amount\"}");
            return;
        }

        try {
            double amount = Double.parseDouble(amountStr);

            // Fetch exchange rates from openexchangerates.org (base is always USD on free
            // plan)
            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            // Check for non-200 status codes
            if (conn.getResponseCode() != 200) {
                // Try to read the error stream from the API
                String errorBody = new Scanner(conn.getErrorStream()).useDelimiter("\\A").next();
                JsonObject errorJson = gson.fromJson(errorBody, JsonObject.class);
                String errorMessage = errorJson.has("description") ? errorJson.get("description").getAsString()
                        : "API request failed with status " + conn.getResponseCode();
                sendResponse(exchange, 502, "{\"error\":\"" + errorMessage + "\"}");
                return;
            }

            String responseBody = new Scanner(conn.getInputStream()).useDelimiter("\\A").next();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            // The JSON field is "rates", not "conversion_rates"
            JsonObject rates = jsonResponse.getAsJsonObject("rates");

            if (!rates.has(fromCurrency) || !rates.has(toCurrency)) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid currency code provided.\"}");
                return;
            }

            // --- Calculation for USD-based rates ---
            double fromRate = rates.get(fromCurrency).getAsDouble(); // Rate of 'from' currency against USD
            double toRate = rates.get(toCurrency).getAsDouble(); // Rate of 'to' currency against USD

            // Convert amount to USD first, then to the target currency
            double amountInUsd = amount / fromRate;
            double convertedAmount = amountInUsd * toRate;

            // Calculate the direct rate for display purposes
            double directRate = toRate / fromRate;

            // Send result back to client
            String jsonResult = String.format(
                    "{\"from\":\"%s\", \"to\":\"%s\", \"amount\":%.2f, \"convertedAmount\":%.2f, \"rate\":%.6f}",
                    fromCurrency, toCurrency, amount, convertedAmount, directRate);

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            sendResponse(exchange, 200, jsonResult);

        } catch (NumberFormatException e) {
            sendResponse(exchange, 400, "{\"error\":\"Invalid amount format.\"}");
        } catch (IOException e) {
            e.printStackTrace();
            sendResponse(exchange, 502, "{\"error\":\"Error connecting to currency API.\"}");
        }
    }

    // --- Helper methods (serveStaticFiles, getContentType, queryToMap,
    // sendResponse) are unchanged ---
    // (They are included here for completeness)

    private static void serveStaticFiles(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if ("/".equals(path)) {
            path = "/index.html";
        }

        String resourcePath = "/static" + path;
        InputStream is = CurrencyConverter.class.getResourceAsStream(resourcePath);

        if (is == null) {
            sendResponse(exchange, 404, "File Not Found");
            return;
        }

        String contentType = getContentType(path);
        exchange.getResponseHeaders().set("Content-Type", contentType);

        exchange.sendResponseHeaders(200, 0);
        try (OutputStream os = exchange.getResponseBody()) {
            is.transferTo(os);
        } finally {
            is.close();
        }
    }

    private static String getContentType(String path) {
        if (path.endsWith(".html"))
            return "text/html";
        if (path.endsWith(".css"))
            return "text/css";
        if (path.endsWith(".js"))
            return "application/javascript";
        return "application/octet-stream";
    }

    private static Map<String, String> queryToMap(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null)
            return result;
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1) {
                result.put(entry[0], entry[1]);
            } else {
                result.put(entry[0], "");
            }
        }
        return result;
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.sendResponseHeaders(statusCode, response.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes(StandardCharsets.UTF_8));
        }
    }
}