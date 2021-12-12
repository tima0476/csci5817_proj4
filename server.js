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
// PostgreSQL connection
//
const dbConfig = {
    host: "host",
    port: 5432,
    database: "testdb",
    user: "postgres",
    password: "abc123"
};

const db = pg(dbConfig);

//
// Redis connection
//
const DEFAULT_EXPIRATION = 3600;
const redisClient = redis.createClient();
redisClient.on("connect", function() { console.log("Connected to Redis"); });
redisClient.on("error", err => { console.log("Redis Error " + err); });

//
// Setup server endpoints
//
app.get("/rest", (req, res) => {
    console.log("In the REST endpoint");
})

app.get("/orders", async (req, res) => {
    console.log("In the Postgres endpoint");
    
    let qs = "SELECT * FROM OrderDetails";
    let addedWhere = false;

    if (typeof req.query.OrderID !== "undefined") {
        qs += ` WHERE OrderID=${req.query.OrderID}`;
        addedWhere = true;
    }

    if (typeof req.query.ProductID !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `ProductID=${req.query.ProductID}`;
    }
    
    if (typeof req.query.UnitPrice !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `UnitPrice=${req.query.UnitPrice}`;
    }
    
    if (typeof req.query.Quantity !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `Quantity=${req.query.Quantity}`;
    }
    
    if (typeof req.query.Discount !== "undefined") {
        qs += (addedWhere ? " AND " : " WHERE ");
        qs += `Discount=${req.query.Discount}`;
    }
    
    qs += ";";
    console.log("  The query is: " + qs);

    try {
        res.send(await db.any(qs, [true]));
    }
    catch(e) {
        console.log("Error in Postgres endpoint: ", e);
        res.send("Error in Postgres endpoint: " + e);
    }
})
//
// Launch the server
//
app.listen(3000);