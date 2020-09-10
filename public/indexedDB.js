/*jshint esversion: 6 */

// Initialise db
let db;

// Request an indexedDB instance
const request = indexedDB.open("budget", 1);

// Create an object store inside the onupgradeneeded method
request.onupgradeneeded = ({ target }) => {
    let db = target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

// On success, if navigator is online, call the postTransactions function
request.onsuccess = ({ target }) => {
    db = target.result;
    if (navigator.onLine) {
        postTransactions();
    }
};

// On error, alert the error
request.onerror = (event) => {
    alert("There was an error processing the transaction. Reference code: " + event.target.errorCode);
};

// Retrieve pending transactions then bulk post
const postTransactions = () => {
    let pendingTransactions = (db.transaction(["pending"], "readwrite"))
        .objectStore("pending")
        .getAll();
    pendingTransactions.onsuccess = () => {
        if (pendingTransactions.result.length > 0) {
            console.log("Posting the following transactions: " + JSON.stringify(pendingTransactions.result));
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(pendingTransactions.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    // Clear pending records if successful
                    let pendingTransactions = db.transaction(["pending"], "readwrite")
                        .objectStore("pending");
                    pendingTransactions.clear();
                });
        }
    };
};

// Used by index.js on fetch failed
const saveRecord = (data) => {
    let pendingTransactions = db.transaction(["pending"], "readwrite")
        .objectStore("pending");
    pendingTransactions.add(data);
};

// When the app is back online, post any pending transactions
window.addEventListener("online", postTransactions);