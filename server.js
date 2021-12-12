// CSCI 5817 Database Systems - Project 4: Redis
//
// Timothy Mason, tima0476@colorado.edu
//
// University of Colorado Boulder

// https://stackoverflow.com/questions/56824788/how-to-connect-to-windows-postgres-database-from-wsl


const axios = require("axios");     // https://www.npmjs.com/package/axios HTTP Client
const cors = require("cors");       // https://www.npmjs.com/package/cors Cross-origin resource sharing (CORS). Allows 
                                    //      restricted resources on a web page to be requested from another domain 
                                    //      outside the domain from which the first resource was served.
const express = require("express"); // https://www.npmjs.com/package/express Web application framework
const { pgClient } = require("pg"); // https://www.npmjs.com/package/pg. Non-blocking PostgreSQL client.
const pg = require("pg-promise")(); // https://www.npmjs.com/package/pg-promise PostgreSQL interface for node.js
const redis = require("redis");     // https://www.npmjs.com/package/redis In-memory data structure store, used as a 
                                    //      database, cache, and message broker. 

app = express();

//
// Establish postgres connection
//
const db = pg({
    host: "host",   // Can't use localhost for wsl connections to the Windows postgres server.
        // https://stackoverflow.com/questions/56824788/how-to-connect-to-windows-postgres-database-from-wsl
    port: 5432,
    database: "testdb",
    user: "postgres",
    password: "abc123"
});

//
// Establish Redis connection
//
const DEFAULT_EXPIRATION = 3600;
const redisClient = redis.createClient();
redisClient.on("connect", ( ) => { console.log("Connected to Redis"); });
redisClient.on("error", err => { 
    let msg = "Error connecting to Redis: " + err;
    console.error(msg); 
    throw new FatalError(msg);
});

//
// REST API endpoint
//
app.get("/universities", async (req, res) => {
    console.log("In the REST endpoint");
    //
    // https://github.com/Hipo/university-domains-list
    // API: https://github.com/Hipo/university-domains-list-api  parameters: country, name
    // example http://universities.hipolabs.com/search?country=United+States
    //

    // Build a redis key and check if we've already cached this query
    let key = `universities:${req.query.country}:${req.query.name}`;
    console.log(`  Redis Key: ${key}`);

    await redisClient.get(key, async (err, reply) => {
        if (err) throw err;

        if (reply == null) {
            // Not in redis cache - build a query URL based on our GET parameters
            console.log("  Redis cache miss");
            let url = "http://universities.hipolabs.com/search?";
            let needSep = false;
            
            if (typeof req.query.country !== "undefined") {
                url += `country=${req.query.country}`;
                needSep = true;
            }
            
            if (typeof req.query.name !== "undefined") {
                if (needSep) url += "&";
                url += `name=${req.query.name}`;
                needSep = true;
            }
            
            console.log(`  URL: ${url}`);
            
            try {
                const response = await axios.get(url);
                // console.log(response.data);
                res.send(response.data);

                // cache in Redis
                await redisClient.set(key, JSON.stringify(response.data));
            } catch(e) {
                console.error(e);
                res.send("Error in REST endpoint: " + e);
            }
        } else {
            // Redis cache hit!  Output the data
            console.log("  Redis cache HIT!");
            res.send(JSON.parse(reply));
        }
    });

})

//
// Postgresql endpoint
//
app.get("/orders", async (req, res) => {
    console.log("In the Postgres endpoint");
    
    // Build an SQL query and redis key based on our GET parameters
    let qs = "SELECT * FROM OrderDetails";
    let addedWhere = false;

    if (typeof req.query.OrderID !== "undefined") {
        qs += ` WHERE OrderID=${req.query.OrderID}`;
        addedWhere = true;
    }

    if (typeof req.query.ProductID !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `ProductID=${req.query.ProductID}`;
        addedWhere = true;
    }
    
    if (typeof req.query.UnitPrice !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `UnitPrice=${req.query.UnitPrice}`;
        addedWhere = true;
    }
    
    if (typeof req.query.Quantity !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `Quantity=${req.query.Quantity}`;
        addedWhere = true;
    }
    
    if (typeof req.query.Discount !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `Discount=${req.query.Discount}`;
        addedWhere = true;
    }
    
    qs += ";";
    console.log("  Query: " + qs);

    try {
        res.send(await db.any(qs, [true]));
    }
    catch(e) {
        console.error("Error in Postgres endpoint: ", e);
        res.send("Error in Postgres endpoint: " + e);
    }
})
//
// Launch the server
//
app.listen(3000);