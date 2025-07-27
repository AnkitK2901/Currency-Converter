// File: CachedData.java
package com.currency;

import com.google.gson.JsonObject;

public class CachedData {
    private final JsonObject data;
    private final long timestamp;

    public CachedData(JsonObject data) {
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    public JsonObject getData() {
        return data;
    }

    // Check if cache is older than maxAge (in milliseconds)
    public boolean isExpired(long maxAgeMillis) {
        return (System.currentTimeMillis() - timestamp) > maxAgeMillis;
    }
}