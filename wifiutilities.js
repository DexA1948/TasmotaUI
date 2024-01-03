var locip;

function getIpAddressFromUrl(url) {
    const matches = url.match(/^(http:\/\/)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (matches && matches[2]) {
        return matches[2];
    } else {
        return null;
    }
}

function createUrl(ip, command) {
    return `http://${ip}/cm?cmnd=${command}`;
}

function checkFirmwareConnection(ip) {
    const firmwareCheckUrl = createUrl(ip, 'status%205');
    return fetch(firmwareCheckUrl)
        .then(response => response.json())
        .then(data => {
            if (data.StatusNET) {
                console.log('Connected to Firmware:', data.StatusNET.Hostname);
                return true;
            } else {
                console.error('Not connected to Firmware');
                criticalErrorAndReload('Not connected to Firmware', 40);
                return false;
            }
        })
        .catch(error => {
            console.error('Error checking Firmware connection:', error);
            // Handle any errors
            // criticalErrorAndReload('Error checking Firmware connection', 40);

            return false;
        });
}

// Use if the endpoint is not returning processed results
// function processWifiScanResults(data) {
//     console.log('Data before processing');
//     console.log(data);

//     const networksArray = Object.keys(data.WiFiScan).map(key => data.WiFiScan[key]);

//     const sortedNetworks = networksArray.sort((a, b) => parseInt(b.RSSI) - parseInt(a.RSSI));

//     const uniqueNetworks = sortedNetworks.reduce((unique, network) => {
//         if (!unique.some(existingNetwork => existingNetwork.SSId === network.SSId)) {
//             unique.push(network);
//         }
//         return unique;
//     }, []);

//     return uniqueNetworks;
// }


function scanForWiFi(ip) {
    const wifiScanUrlFirst = createUrl(ip, 'WifiScan%201');
    const wifiScanUrl = createUrl(ip, 'WifiScan');
    const maxAttempts = 10; // Maximum number of polling attempts
    const interval = 500; // Interval between attempts in milliseconds (2 seconds)

    function attemptFetch(attempt) {
        return new Promise((resolve, reject) => {
            fetch(wifiScanUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.WiFiScan.NET1) {
                        // same results achieved so ignoring this right now
                        // data = processWifiScanResults(data);
                        // console.log(data);
                        resolve(data);
                    } else if (attempt < maxAttempts) {
                        setTimeout(() => {
                            resolve(attemptFetch(attempt + 1)); // Try again after the interval
                        }, interval);
                    } else {
                        reject(new Error('Maximum attempts reached without completion'));
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    fetch(wifiScanUrlFirst);

    return new Promise(resolve => {
        setTimeout(() => {
            resolve(attemptFetch(0));
        }, 1000);
    });
}

function scanAllWifi() {
    showLoadingWhole();
    let ipAddress = localStorage.getItem('connectedIp');

    if (ipAddress) {
        checkFirmwareConnection(ipAddress).then(isConnected => {
            if (isConnected) {
                showLoadingWhole();
                // scanForWiFi(ipAddress);
                scanForWiFi(ipAddress)
                    .then(data => {
                        // console.log(data);
                        // console.log(data.WiFiScan);
                        // console.log(data.WiFiScan.NET1);

                        var wifiContainer = document.getElementById('putwifishere');
                        wifiContainer.innerHTML = " ";

                        for (const key in data.WiFiScan) {
                            if (data.WiFiScan.hasOwnProperty(key)) {
                                const network = data.WiFiScan[key];
                                // console.log(network.SSId);
                                networkContainer = document.createElement('div');
                                networkContainer.classList.add('wifi-ssids');
                                networkContainer.innerHTML = '<span onclick="c(this)">' + network.SSId + '</span>' + '<span class="q">' + signalStrengthSVG(rssiToRating(network.RSSI)) + '</span>';
                                wifiContainer.appendChild(networkContainer);
                            }
                        }

                    })
                    .catch(error => {
                        console.error('WiFi scan failed:', error);
                    }).finally(() => {
                        hideLoadingWhole();
                    });
            }
        });
    } else {
        console.error('Invalid IP address.');
    }
}

function onLoad() {
    showLoadingWhole();
    hideCommonWrapper();

    // Initialize an array to store potential IP addresses
    let ipAddresses = [];

    // Check if each of the IP addresses exists in localStorage and add them to the array
    ['locIp', 'locIp1', 'locIp2'].forEach(key => {
        let ip = localStorage.getItem(key);
        if (ip) {
            ipAddresses.push(ip);
        }
    });

    // If no IP addresses are stored, prompt the user to enter one
    if (ipAddresses.length === 0) {
        let newIp = prompt("File Mode. Please enter WLED IP!");
        if (newIp) {
            localStorage.setItem('locIp', newIp);
            ipAddresses.push(newIp);
        }
    }

    let connectionAttempts = 0;

    // Function to handle the firmware connection for a given IP address
    const handleFirmwareConnection = (ipAddress) => {
        return checkFirmwareConnection(ipAddress).then(isConnected => {
            if (isConnected) {
                localStorage.setItem('connectedIp', ipAddress);
                showLoadingWhole();
                scanForWiFi(ipAddress)
                    .then(data => {
                        // console.log(data);
                        // console.log(data.WiFiScan);
                        // console.log(data.WiFiScan.NET1);

                        var wifiContainer = document.getElementById('putwifishere');
                        for (let i = 0; i < wifiContainer.children.length; i++) {
                            // console.log(wifiContainer.children[i]);
                            wifiContainer.removeChild(wifiContainer.children[i]);
                        }

                        for (const key in data.WiFiScan) {
                            if (data.WiFiScan.hasOwnProperty(key)) {
                                const network = data.WiFiScan[key];
                                // console.log(network.SSId);
                                networkContainer = document.createElement('div');
                                networkContainer.classList.add('wifi-ssids');
                                networkContainer.innerHTML = '<span onclick="c(this)">' + network.SSId + '</span>' + '<span class="q">' + signalStrengthSVG(rssiToRating(network.RSSI)) + '</span>';
                                wifiContainer.appendChild(networkContainer);
                            }
                        }

                        // console.log("length", wifiContainer.children.length);
                        for (let i = wifiContainer.children.length - 1; i > 4; i--) {
                            // console.log('child is');
                            // console.log(wifiContainer.children[i]);
                            wifiContainer.removeChild(wifiContainer.children[i]);
                        }

                    })
                    .catch(error => {
                        console.error('WiFi scan failed:', error);
                        criticalErrorAndReload('WiFi scan failed', 10);
                    }).finally(() => {
                        hideLoadingWhole();
                    });

                return true;
            } else {
                // Increment the connection attempts counter
                connectionAttempts++;
                // Check if all attempts have been made
                if (connectionAttempts === ipAddresses.length) {
                    console.error('All connection attempts failed.');
                }
                return false;
            }
        });
    };

    // Iterate through the IP addresses and attempt a connection
    ipAddresses.forEach(ipAddress => {
        handleFirmwareConnection(ipAddress).then(isConnected => {
            if (isConnected) {
                console.log(`Connected using IP: ${ipAddress}`);
                // localStorage.setItem('connectedIp', ipAddress);
                // Break out of the loop if a connection is established
                return;
            }
        });
    });
}

async function onLoad() {
    localStorage.setItem('defaultIp', '192.168.4.1');
    showLoadingWhole();
    hideCommonWrapper();

    let connectionAttempts = 0;

    const handleFirmwareConnection = async (ipAddress) => {
        return checkFirmwareConnection(ipAddress).then(isConnected => {
            if (isConnected) {
                localStorage.setItem('connectedIp', ipAddress);
                showLoadingWhole();
                scanForWiFi(ipAddress)
                    .then(data => {
                        var wifiContainer = document.getElementById('putwifishere');
                        while (wifiContainer.firstChild) {
                            wifiContainer.removeChild(wifiContainer.firstChild);
                        }

                        Object.values(data.WiFiScan).forEach(network => {
                            let networkContainer = document.createElement('div');
                            networkContainer.classList.add('wifi-ssids');
                            networkContainer.innerHTML = `<span onclick="c(this)">${network.SSId}</span><span class="q">${signalStrengthSVG(rssiToRating(network.RSSI))}</span>`;
                            wifiContainer.appendChild(networkContainer);
                        });

                        while (wifiContainer.children.length > 5) {
                            wifiContainer.removeChild(wifiContainer.lastChild);
                        }

                    })
                    .catch(error => {
                        console.error('WiFi scan failed:', error);
                        criticalErrorAndReload('WiFi scan failed', 10);
                    }).finally(() => {
                        hideLoadingWhole();
                    });

                return true;
            }
            return false;
        });
    };

    let ipAddress = getIpAddressFromUrl(window.location.hostname);

    if (!ipAddress) {
        let ipAddresses = ['defaultIp', 'locIp', 'locIp1', 'locIp2'].map(key => localStorage.getItem(key)).filter(ip => ip);

        if (!localStorage.getItem('locIp')) {
            let newIp = prompt("File Mode. Please enter IP for your EPAL device!");
            if (newIp) {
                localStorage.setItem('locIp', newIp);
                ipAddresses.push(newIp);
            }
        }

        for (const ipAddr of ipAddresses) {
            const isConnected = await handleFirmwareConnection(ipAddr);
            if (isConnected) {
                console.log(`Connected using IP: ${ipAddr}`);
                break;
            } else {
                connectionAttempts++;
                if (connectionAttempts === ipAddresses.length) {
                    console.error('All connection attempts failed.');
                    criticalErrorAndReload("Connection Attempts Failed <br> Check your connection");
                }
            }
        }
    } else {
        const isConnected = await handleFirmwareConnection(ipAddress);
        if (isConnected) {
            console.log(`Connected using IP: ${ipAddress}`);
        } else {
            console.error('All connection attempts failed.');
            criticalErrorAndReload("Connection Attempts Failed <br> Check your connection");
        }
    }
}



// function onLoad() {
//     showLoadingWhole();
//     hideCommonWrapper();
//     let ipAddress = getIpAddressFromUrl(window.location.hostname);

//     if (!ipAddress) {
//         locip = localStorage.getItem('locIp');
//         if (!locip) {
//             locip = prompt("File Mode. Please enter WLED IP!");
//             localStorage.setItem('locIp', locip);
//         }
//         ipAddress = locip;
//     }

//     if (ipAddress) {
//         checkFirmwareConnection(ipAddress).then(isConnected => {
//             if (isConnected) {
//                 showLoadingWhole();
//                 // scanForWiFi(ipAddress);
//                 scanForWiFi(ipAddress)
//                     .then(data => {
//                         // console.log(data);
//                         // console.log(data.WiFiScan);
//                         // console.log(data.WiFiScan.NET1);

//                         var wifiContainer = document.getElementById('putwifishere');
//                         for (let i = 0; i < wifiContainer.children.length; i++) {
//                             // console.log(wifiContainer.children[i]);
//                             wifiContainer.removeChild(wifiContainer.children[i]);
//                         }

//                         for (const key in data.WiFiScan) {
//                             if (data.WiFiScan.hasOwnProperty(key)) {
//                                 const network = data.WiFiScan[key];
//                                 // console.log(network.SSId);
//                                 networkContainer = document.createElement('div');
//                                 networkContainer.classList.add('wifi-ssids');
//                                 networkContainer.innerHTML = '<span onclick="c(this)">' + network.SSId + '</span>' + '<span class="q">' + signalStrengthSVG(rssiToRating(network.RSSI)) + '</span>';
//                                 wifiContainer.appendChild(networkContainer);
//                             }
//                         }

//                         // console.log("length", wifiContainer.children.length);
//                         for (let i = wifiContainer.children.length - 1; i > 4; i--) {
//                             // console.log('child is');
//                             // console.log(wifiContainer.children[i]);
//                             wifiContainer.removeChild(wifiContainer.children[i]);
//                         }

//                     })
//                     .catch(error => {
//                         // Handle any errors
//                         console.error('WiFi scan failed:', error);
//                         // Handle any errors
//                         criticalErrorAndReload('WiFi scan failed', 10);
//                     }).finally(() => {
//                         hideLoadingWhole();
//                     });
//             }
//         });
//     } else {
//         console.error('Invalid IP address.');
//         criticalErrorAndReload('Invalid IP Address', 10);
//     }
// }

// function rssiToPercentage(rssi) {
//     let quality = 0;

//     if (rssi <= -100) {
//       quality = 0;
//     } else if (rssi >= -50) {
//       quality = 100;
//     } else {
//       quality = 2 * (rssi + 100);
//     }
//     return quality;
// }

function rssiToRating(rssi) {
    // Define the RSSI range based on the environment.
    // Adjust these based on the actual RSSI values you expect to receive.
    const maxRssi = 50;  // Represents the strongest signal strength.
    const minRssi = 0;    // Represents the weakest signal strength that's still usable.

    // Normalize the RSSI value to a 0 to 1 range.
    const normalizedRssi = (rssi - minRssi) / (maxRssi - minRssi);

    // Scale the normalized value to a range of 1 to 5.
    let rating = normalizedRssi * 4 + 1;

    // Ensure the rating is within bounds.
    rating = Math.max(Math.min(rating, 5), 1);

    // console.log('rssi is:', rssi)
    // console.log('rating is:', rating)
    return parseInt(rating);
}


// for signal svgs
function signalStrengthSVG(p) {
    var svg = '<svg width="36" height="36" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"> <rect x="3" y="27" width="3" height="3" fill="white" rx="1.5" ry="1.5" />';
    switch (p) {
        case 1:
        case 2:
            svg += '<rect x="7.5" y="22.5" width="3" height="7.5" fill="white" rx="1.5" ry="1.5" />'
            break;
        case 3:
            svg += '<rect x="7.5" y="22.5" width="3" height="7.5" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="12" y="18" width="3" height="12" fill="white" rx="1.5" ry="1.5" />'
            break;
        case 4:
            svg += '<rect x="7.5" y="22.5" width="3" height="7.5" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="12" y="18" width="3" height="12" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="16.5" y="13.5" width="3" height="16.5" fill="white" rx="1.5" ry="1.5" />'
            break;
        case 5:
            svg += '<rect x="7.5" y="22.5" width="3" height="7.5" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="12" y="18" width="3" height="12" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="16.5" y="13.5" width="3" height="16.5" fill="white" rx="1.5" ry="1.5" />'
            svg += '<rect x="21" y="9" width="3" height="21" fill="white" rx="1.5" ry="1.5" />'
            break;
    }
    svg += '</svg>';
    return (svg);
}

function showOverlay(selector, text) {
    selector.style.display = "flex";
    selector.querySelector(".text-holder").innerHTML = text;
}

function hideItem(selector) {
    selector.style.display = "none";
}

async function performConnectionTest(ssid, pwd) {
    let connectionButton = eb("connectionTestButton1");
    connectionButton.disabled = true;
    connectionButton.innerHTML = "Testing...";

    let overlay = document.querySelector("#thewifibox1 .thewifiboxoverlay");
    showOverlay(overlay, "Testing");

    console.log("Hello Testing Wifi");
    const endpoint1 = `http://192.168.4.1/cm?cmnd=WifiTest%20${ssid}%2B${pwd}`;
    const endpoint2 = "http://192.168.4.1/cm?cmnd=WifiTest";
    const endpoint3 = "http://192.168.4.1/cm?cmnd=status%205";

    console.log(endpoint1);
    try {
        // Poll the first endpoint
        const response1 = await fetch(endpoint1);
        const data1 = await response1.json();
        console.log("Endpoint 1: " + JSON.stringify(data1));
        if (data1.WiFiTest1 === "Testing") {

            let data2;
            do {
                // Wait for 1 second before polling endpoint2
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Poll the second endpoint
                const response2 = await fetch(endpoint2);
                data2 = await response2.json();
                console.log("Endpoint 2: " + JSON.stringify(data2));
            } while (data2.WiFiTest === "Testing");

            if (data2.WiFiTest === "Successful") {
                // If the connection is successful, poll the third endpoint
                const response3 = await fetch(endpoint3);
                const data3 = await response3.json();
                console.log("Endpoint 3: " + JSON.stringify(data3));

                // Log the new IP address
                const newIPAddress = data3.StatusNET.IPAddress;
                console.log("New IP Address: " + newIPAddress);

                // Add to localstorage so can be found easily
                localStorage.setItem('locIp1', newIPAddress);
                localStorage.setItem('ssid1', ssid);

                // showSuccess("Successfully Saved SSID and PW" + data2.WiFiTest + "<br> New IP Address on SSID:" +ssid +"::" + newIPAddress, 10);
                connectionButton.disabled = false;
                connectionButton.innerHTML = "Save";
                showOverlay(overlay, `!Success! <br><br> IP: ${newIPAddress} at ${ssid} <br><br>`);
                setTimeout(() => { hideItem(overlay) }, 10000);
            } else {
                console.log("Connection failed with message: " + data2.WiFiTest);
                // criticalErrorAndReload("Connection failed with message: " + data2.WiFiTest, 10);
                connectionButton.disabled = false;
                connectionButton.innerHTML = "Save";
                showOverlay(overlay, `Primary WiFi Configurations Saved <br><br> Failed To Connect <br><br> ${data2.WiFiTest} <br><br>`);
                setTimeout(() => { hideItem(overlay) }, 10000);
            }
        } else if (data1.WiFiTest === "Busy") {
            console.log("Another WiFi is being tested right now");
            // criticalErrorAndReload("Couldn't start Wifi Testing using SSID and Password <br> Wifi Testing Failed", 10);
            connectionButton.disabled = false;
            connectionButton.innerHTML = "Save";
            showOverlay(overlay, `Another WiFi is being tested right now`);
            setTimeout(() => { hideItem(overlay) }, 10000);
        } else {
            console.log("Error at endpoint 1 on sending SSID and Password");
            // criticalErrorAndReload("Couldn't start Wifi Testing using SSID and Password <br> Wifi Testing Failed", 10);
            connectionButton.disabled = false;
            connectionButton.innerHTML = "Save";
            showOverlay(overlay, `Failed Testing: Try Again`);
            setTimeout(() => { hideItem(overlay) }, 10000);
        }
    } catch (error) {
        console.error("An error occurred: " + error.message);
        // criticalErrorAndReload("An error occurred: " + error.message, 10);
        connectionButton.disabled = false;
        connectionButton.innerHTML = "Save";
        showOverlay(overlay, `An Error Occured: Try Again`);
        setTimeout(() => { hideItem(overlay) }, 10000);
    }
}


async function performConnectionTest2(ssid, pwd) {
    await performConnectionTest(document.getElementById('s1').value, document.getElementById('p1').value);

    let connectionButton = eb("connectionTestButton2");
    connectionButton.disabled = true;
    connectionButton.innerHTML = "Testing...";

    let overlay = document.querySelector("#thewifibox2 .thewifiboxoverlay");
    // showOverlay(overlay, "Testing");

    console.log("Hello Testing Wifi");
    const endpoint1 = `http://192.168.4.1/cm?cmnd=WifiTest2%20${ssid}%2B${pwd}`;
    const endpoint2 = "http://192.168.4.1/cm?cmnd=WifiTest";
    const endpoint3 = "http://192.168.4.1/cm?cmnd=status%205";
    const endpoint4 = "http://192.168.4.1/cm?cmnd=SSID2";

    console.log(endpoint1);
    try {
        // Poll the first endpoint
        const response1 = await fetch(endpoint1);
        const data1 = await response1.json();
        console.log("Test 2: Endpoint 1: " + JSON.stringify(data1));
        if (data1.WiFiTest2 === "Testing") {

            let data2;
            do {
                // Wait for 1 second before polling endpoint2
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Poll the second endpoint
                const response2 = await fetch(endpoint2);
                data2 = await response2.json();
                console.log("Test 2: Endpoint 2: " + JSON.stringify(data2));
            } while (data2.WiFiTest === "Testing" || data2.WiFiTest === "Not Started");

            if (data2.WiFiTest === "Successful") {
                // If the connection is successful, poll the third endpoint
                const response3 = await fetch(endpoint3);
                const data3 = await response3.json();
                console.log("Test 2: Endpoint 3: " + JSON.stringify(data3));

                // Log the new IP address
                const newIPAddress = data3.StatusNET.IPAddress;
                console.log("Test 2: New IP Address: " + newIPAddress);

                // Add to localstorage so can be found easily
                localStorage.setItem('locIp2', newIPAddress);
                localStorage.setItem('ssid2', ssid);

                // showSuccess("Successfully Saved SSID and PW" + data2.WiFiTest + "<br> New IP Address on SSID:" +ssid +"::" + newIPAddress, 10);
                connectionButton.disabled = false;
                connectionButton.innerHTML = "Save";
                // showOverlay(overlay, `!Success! <br><br> IP: ${newIPAddress} at ${ssid} <br><br>`);
                // setTimeout(() => { hideItem(overlay) }, 5000);
            } else {
                console.log("Test 2: Connection failed with message: " + data2.WiFiTest);
                // criticalErrorAndReload("Connection failed with message: " + data2.WiFiTest, 10);
                connectionButton.disabled = false;
                connectionButton.innerHTML = "Save";
                // showOverlay(overlay, `Connect Failed: Try Again <br><br> ${data2.WiFiTest} <br><br>`);
                // setTimeout(() => { hideItem(overlay) }, 5000);
            }
        } else if (data1.WiFiTest === "Busy") {
            console.log("Another WiFi is being tested right now");
            // criticalErrorAndReload("Couldn't start Wifi Testing using SSID and Password <br> Wifi Testing Failed", 10);
            connectionButton.disabled = false;
            connectionButton.innerHTML = "Save";
            // showOverlay(overlay, `Another WiFi is being tested right now <br><br> Try Again Later <br><br>`);
            // setTimeout(() => { hideItem(overlay) }, 3000);
        } else {
            console.log("Test 2: Error at endpoint 1 on sending SSID and Password");
            // criticalErrorAndReload("Couldn't start Wifi Testing using SSID and Password <br> Wifi Testing Failed", 10);
            connectionButton.disabled = false;
            connectionButton.innerHTML = "Save";
            // showOverlay(overlay, `Failed Testing: Try Again`);
            // setTimeout(() => { hideItem(overlay) }, 3000);
        }
    } catch (error) {
        console.error("An error occurred: " + error.message);
        // criticalErrorAndReload("An error occurred: " + error.message, 10);
        connectionButton.disabled = false;
        connectionButton.innerHTML = "Save";
        // showOverlay(overlay, `An Error Occured: Try Again`);
        // setTimeout(() => { hideItem(overlay) }, 3000);
    }

    try {
        const response4 = await fetch(endpoint4);
        const data4 = await response4.json();
        console.log("Test 2: Endpoint 4: " + JSON.stringify(data4));
        if (data4.SSId2 === ssid) {
            showOverlay(overlay, `Successfully Saved Alternative WiFI Credentials`);
        } else {
            showOverlay(overlay, `Warning Failed To Save Alternative WiFI Credentials`);
            setTimeout(() => { hideItem(overlay) }, 10000);
        }
    } catch (error) {
        console.error("An error occurred: " + error.message);
        showOverlay(overlay, `Warning Failed To Save Alternative WiFI Credentials`);
        setTimeout(() => { hideItem(overlay) }, 10000);
    }
}


