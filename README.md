# 📥 StreamElements Leaderboard Exporter

A lightweight, open-source microservice built with Node.js and Express to bypass platform UI restrictions and programmatically export your complete StreamElements loyalty leaderboard (Points and Watchtime) directly into a standard CSV file.

## 🛡️ Trust & Security First

**Your JWT Token is completely secure.** This utility acts solely as a transient data conduit:
* **No Database Connection:** This app does not have a database. It cannot store data even if it wanted to.
* **No Logging:** Your JWT Token and Channel ID are processed directly in-memory within the scope of the HTTP request and are never written to server logs.
* **Ephemeral Memory:** Once the API stream finishes compiling your CSV, the token is instantly discarded from temporary server memory.

*Because this repository is 100% public, you can audit the code in `server.js` yourself to verify exactly how your credentials are handled.*

## ✨ Features

* 🚀 **Full Leaderboard Extraction:** Pulls every single active user on your loyalty board, formatting 100 entries at a time until complete.
* 🕒 **Watchtime Included:** Automatically captures loyalty `Points` and total `Watchtime (Minutes)` for every user.
* 📊 **Clean Data Output:** Compiles everything into a standard, three-column CSV file (`Username,Points,Watchtime (Minutes)`) wrapped in quotes to prevent parse errors.
* 🛡️ **Rate-Limited API:** Includes production-safe protection restricting abuse to a maximum of 5 download requests per 15 minutes per IP address.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **HTTP Client:** Axios (for communicating with the official StreamElements API)
* **Security:** Express-Rate-Limit

## 🚀 Quick Start (Local Deployment)

If you prefer to run this tool entirely on your own local machine instead of a hosted server, follow these quick steps:

### 1. Clone the repository
```bash
git clone [https://github.com/Festival-Smiles/se-export.git](https://github.com/Festival-Smiles/se-export.git)
cd se-export
