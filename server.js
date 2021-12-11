// CSCI 5817 Database Systems - Project 4: Redis
//
// Timothy Mason, tima0476@colorado.edu
//
// University of Colorado Boulder

const axios = require('axios');     // HTTP Client
const cors = require('cors');       // Cross-origin resource sharing (CORS). Allows restricted resources on a web page 
                                    // to be requested from another domain outside the domain from which the first
                                    // resource was served.
const express = require('express'); // web application framework
const pg = require('pg-promise');   // PostgreSQL interface for node.js
const redis = require('redis');     // in-memory data structure store, used as a database, cache, and message broker. 

