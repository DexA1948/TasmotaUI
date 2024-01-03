var x = null, lt, to, tp, pc = '';
eb = s => document.getElementById(s);
qs = s => document.querySelector(s);

function sp(i) {
    eb(i).type = (eb(i).type === 'password' ? 'text' : 'password');
    document.querySelector('.passwordeye img').src = (eb(i).type === 'password' ? 'passwordshow.svg' : 'passwordhide.svg');
}

function wl(f) {
    window.addEventListener('load', f);
}

function c(l) {
    eb('s1').value = l.innerText || l.textContent;
    eb('p1').focus();
}

function hidBtns(a) {
    if (a) {
        eb('butmo').style.display = 'none';
        eb('butmo2').style.display = 'block';
        eb('but0').style.display = 'block';
        eb('thewifibox2').style.display = 'block';
        eb('connectionTestButton1').style.display = 'none';
    }else{
        eb('butmo').style.display = 'block';
        eb('butmo2').style.display = 'none';
        eb('but0').style.display = 'none';
        eb('thewifibox2').style.display = 'none'; 
        eb('connectionTestButton1').style.display = 'block';  
    }

}

function jd() {
    var t = 0,
        i = document.querySelectorAll('input,button,textarea,select');
    while (i.length >= t) {
        if (i[t]) {
            i[t]['name'] = (i[t].hasAttribute('id') && (!i[t].hasAttribute('name'))) ? i[t]['id'] : i[t]['name'];
        }
        t++;
    }
}

wl(jd);

// show and hide loading screens
function showLoadingWhole() {
    document.getElementById('loading-wrapper').style.display = 'flex';
}

// show and hide loading screens
function hideLoadingWhole() {
    document.getElementById('loading-wrapper').style.display = 'none';
}

// Device restart


// This function will start a countdown from 10 to 0.
function startCountdown(a) {
    // Find the <span> tag within the .wrapper-timer div.
    const timerSpan = document.querySelector('#common-wrapper .wrapper-timer span');

    // Set the countdown start value.
    let timeLeft = a;

    // Update the <span> tag with the current countdown value.
    timerSpan.textContent = timeLeft;

    // Start the countdown timer.
    const countdownInterval = setInterval(() => {
        timeLeft -= 1;
        timerSpan.textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval); // stop the countdown
            window.location.reload(); // reload the page
        }
    }, 1000);
}

function hideCommonWrapper() {
    document.getElementById('common-wrapper').style.display = 'none';
}

function restartDevice() {
    document.getElementById('common-wrapper').style.display = 'flex';
    document.querySelector('#common-wrapper .wrapper-texter').innerHTML = '<hr><br> Device Is Restarting.<br>Please Check Your Connection at: <br><i>' + ( (localStorage.getItem('ssid1') == null) ? 'IP':localStorage.getItem('ssid1')) + ':' + localStorage.getItem('locIp1') +'</i>';

    if (confirm("Restart Device")) {
        restartUrl = createUrl(localStorage.getItem('connectedIp'), "restart%201");
        console.log(restartUrl);
        fetch(restartUrl);
        startCountdown(30);
    }
}

function criticalErrorAndReload(message, countdown=10) {
    hideLoadingWhole();
    document.getElementById('common-wrapper').style.display = 'flex';
    document.getElementById('common-wrapper').style.background = 'red';
    document.querySelector('#common-wrapper .wrapper-timer span').style.color = 'orange';
    document.querySelector('#common-wrapper .wrapper-texter').innerHTML = '<hr><br> Please Check Your Connection <br> & Reload The Page <br><i>' + message + '</i>';
    startCountdown(countdown);
}

function showSuccess(message) {
    hideLoadingWhole();
    document.getElementById('common-wrapper').style.display = 'flex';
    document.getElementById('common-wrapper').style.background = 'green';
    document.querySelector('#common-wrapper .wrapper-timer').style.display = 'none';
    document.querySelector('#common-wrapper .wrapper-texter').innerHTML = '<hr><br> !Yayyy! <br><i>' + message + '</i>';
    setTimeout(() => {
        document.getElementById('common-wrapper').style.display = 'none';
    }, 5000)
}