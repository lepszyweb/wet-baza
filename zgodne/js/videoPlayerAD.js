var adPlayed = false; //checks if AD has played

// var vid = getVid();
var audio = document.getElementById("AD-source1");
var btnRewind = document.getElementById("btnRewind");
var btnForward = document.getElementById("btnForward");
var adBtn = document.getElementById("ADBtn");
 
//websiteNum are globally found in html scripts
//AD Files must be combined into a single AD File with the naming convention of adFileName
if(websiteNum) {
    console.log("This webNum is: ", websiteNum);
}
var xmlFileLocation = "audio/AD_XML/";
var adFileName = 'w' + websiteNum + "_ma" + ".xml";
var description = "";
var adAudio;
var adCues = [];
var adFiles = [];
var audioEls = []; // preload audio - issues with safari
var adCueComparisonArr = [];
var adCuesPlayed = [false];
var adActive = false;
var adPlaying = false;
var curTime;
var lastCue;
var cueIteration;
var curADnum = 0;

description = xmlFileLocation + adFileName;

if (description != '') {
    loadDescriptions();
    getFormattedTime();

}

Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function(){
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})

function overlayClick(bigButton) {
    // first play all the audio tags and then swap their source file.
    // This is implemented like this to make sure AD files play in Safari on iPad.
    // Audio elements need to be given permission to play via interaction, which this function does (click).
    // The silent mp3 plays, then the audio source is swapped, leaving the existing audio tags in place
    //      so they retain the granted permission.
    var adtags = document.getElementsByTagName("audio");
    var elArr = []; // need to do it this way for IE 11 - Array.from() isn't supported
    for (var i = 0; i < adtags.length; i++){
        elArr.push (adtags[i]);
    }
    elArr.forEach(function(entry){
        entry.addEventListener("ended", function(){
            updateADsrc(entry);
        });
        entry.play();
    });

    // After the audio is set up, play the video
    document.getElementById("playButtonLarge").parentElement.removeChild(document.getElementById("playButtonLarge"));
    if(!bigButton) {
        var btnPlay = getBtnPlay();
        btnPlay.innerHTML = "Pauza";
        btnPlay.value = "pause";
    }
    initVidTime();
    document.getElementById("videoPlayer").play();
}
function updateADsrc(el){
    // var el = document.getElementById("ad"+index);
    el.removeEventListener("ended", function(){}, true);
    el.addEventListener("ended", function(){
        var videoPlayer = getVideoPlayer1();
        videoPlayer.play();
    });
    el.addEventListener("pause", function(){
        var videoPlayer = getVideoPlayer1();
        videoPlayer.play();
    });
    var index = el.id.charAt(2);
    el.src = adFiles[Number(index)];
}

function getVideoPlayer1() {
    return document.getElementById('video1');
}

function getAudioPlayer() {
    var audioPlayer = document.getElementById('ad' + curADnum);
    // var audioPlayer = document.getElementById('audioDescription');

    if (audioPlayer) {
        return audioPlayer;
    }
}

function resetPlayerProperties() {
    adCues = [];
    adFiles = [];
    adCueComparisonArr = [];
    audioEls = [];
    adActive = false; //is the ad button currently playing
    // clearInterval(runInterval);
}

function findADEnabled() {
    var btnAD = document.getElementById("ADBtn");
    if (btnAD.classList.contains("add-underline")) {
        return true;
    } else {
        return false;
    }
}

function loadDescriptions() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            parseDescriptions(xmlhttp);
        }

    };
    xmlhttp.open("GET", description, true);
    xmlhttp.send();
}



function parseDescriptions(XML) {
    var data = XML.responseXML;
    var adFileLocation = "audio/";
    var descriptionNode = data.getElementsByTagName('description');
    var fileReference = data.getElementsByTagName('file');
    for (i = 0; i < descriptionNode.length; i++) {
        adCues.push(descriptionNode[i].getAttribute('cue'));
        adFiles.push(adFileLocation + fileReference[i].childNodes[0].nodeValue);
    }
    createAudioEls();
}

// on mobile safari video doesn't play so we added this line of code
// bottom 2 lines may no longer be necessary but leaving them in doesn't hurt

function newAudioEl(index) {
    var thisEl = document.createElement("audio");
    thisEl.preload = "auto";
    thisEl.src = "./../audio/silent.mp3";
    thisEl.id = "ad" + index;
    document.getElementsByTagName("body")[0].appendChild(thisEl);
}
function newAudioEl(index) {
    var thisEl = document.createElement("audio");
    thisEl.preload = "auto";
    thisEl.src = adFiles[index];
    thisEl.id = "ad" + index;
    thisEl.addEventListener("ended", function () {
        var videoPlayer = getVideoPlayer1();
        videoPlayer.play();
    });
    thisEl.addEventListener("pause", function () {
        var videoPlayer = getVideoPlayer1();
        videoPlayer.play();
    });
    document.getElementsByTagName("body")[0].appendChild(thisEl);
}


function createAudioEls() {
    for (var i = 0; i < adFiles.length; i++) {
        newAudioEl(i);
    }
}

function getFormattedTime() {
    var vid = getVideoPlayer1();
    var rawTime;
    var currentVideo = vid;



    // runInterval = setInterval(function () { getCurrentTime() }, 50);
    vid.addEventListener("timeupdate", function () {
        getCurrentTime();
        if (vid.currentTime < 0.5) {
            // this allows ad to replay when the vid is restarted
            adCuesPlayed = [false];
        }
        if(vid.playing) {
            stopAudio();
         }
    });

    function getCurrentTime() {
        var adEnabled = findADEnabled();
        rawTime = currentVideo.currentTime;

        // if vid is paused, rew or fwrd buttons stop the AD
        pauseOnRewFwd();
        handleADBtnClick();
        pauseOnPlayClick();
        var stringTime = rawTime.toString();
        hours = Math.floor(rawTime / 3600)
        hours = (hours >= 10) ? hours : "0" + hours;
        minutes = Math.floor(rawTime / 60);
        minutes = (minutes >= 10) ? minutes : "0" + minutes;
        seconds = Math.floor(rawTime % 60);
        seconds = (seconds >= 10) ? seconds : "0" + seconds;
        decisecond = rawTime % 1;
        decisecond = decisecond.toString().slice(2, 4);
        curTime = hours + ":" + minutes + ":" + seconds + "." + decisecond;

        /* if (adEnabled)
            console.log(curTime); */
        insertDescriptions();
    }
}

function insertDescriptions() {
    var adEnabled = findADEnabled();
    if (description != '') {
        if (adCuesPlayed.length <= adCues.length) {
            for (i = 0; i < adCues.length; i++) {
                adCuesPlayed.push(false);
            }
        }
        if (adEnabled) {


            for (i = 0; i < adCues.length; i++) {
                cueIteration = i;
                var currQue = adCues[i];
                var initialLastDigitStringToNum = Number(currQue.charAt(9));
                var finalQueTimeString;

                // format comparison adCue based on final digit
                if (adCueComparisonArr.length < adCues.length) {
                    var cueMaxRange = ADCueRange(initialLastDigitStringToNum, finalQueTimeString, currQue, adCueComparisonArr);
                }
                // console.log("This is the current time", curTime);
                //give a minimum 00.2 second buffer for each AD for independent activation
                if (curTime >= adCues[i] && curTime <= adCueComparisonArr[i]) {
                    if (lastCue != curTime) {
                        curADnum = i;
                        var audioPlayer = getAudioPlayer()
                        // IE throws error when audio not loaded. This solves issue
                        audioPlayer.addEventListener('loadedmetadata', function () {
                        audioPlayer.currentTime = 0;
                        }, false);
                        // if audio is playing 2x in a row, fix this code line below
                        if (lastCue != curTime || cueMaxRange != curTime) {
                            adPlaying = true;
                            // console.log(adCuesPlayed);
                            // console.log("iteration ", i);
                            if (adCuesPlayed[i] != undefined) {

                                //check if this AD cue index has been played already
                                if (adCuesPlayed[i] == false) {
                                    //set cue index played to true once played
                                    adCuesPlayed[i] = true;
                                    playAudio();
                                    // console.log("AD PLAYING");
                                    adCuesPlayed[i] = true;
                                    // console.log(adCuesPlayed);
                                }
                                // set lastCue
                                lastCue = curTime;
                            }
                        }
                        updateAudioTime();
                    }
                }
                adPlaying = false;
            }
        }
    }
}

function updateAudioTime() {
    // adActive = true;
    var videoPlayer = getVideoPlayer1();
    var audioPlayer = getAudioPlayer();
    var btnPlay = getBtnPlay();
    //console.log("c: " + audioPlayer.currentTime + ", d: " + audioPlayer.duration);
    if (audioPlayer) {
        if (audioPlayer.currentTime >= audioPlayer.duration) {
            stopAudio();
            adActive = false;
            videoPlayer.play();
        }
        btnPlay.addEventListener("click",function(){
            if(adActive){
                pauseAudio();
            }
        })
    }
}

function pauseOnRewFwd() {
    var audio = getAudioPlayer();
    var videoPlayer = getVideoPlayer1();
    var fwdBtn = document.getElementById("btnForward");
    var rwdBtn = document.getElementById("btnRewind");

    if (videoPlayer) {
        if (videoPlayer.paused) {

            fwdBtn.addEventListener("click", function () {
                // if foward btn is clicked, pause ad
                stopAudio();
                lastCue = "";

                if (typeof cueIteration == "number") {
                    /*
                        once rewind is hit, reset adCuePlayed array all to false
                    */
                    // adCuesPlayed[cueIteration] = false;
                    adCuesPlayed.forEach(function (val, index) {
                        adCuesPlayed[index] = false;
                    })
                }

            });

            rwdBtn.addEventListener("click", function () {
                // if foward btn is clicked, pause ad
                stopAudio();
                if (typeof cueIteration == "number") {
                    /*
                        once rewind is hit, reset adCuePlayed array all to false
                    */
                    adCuesPlayed.forEach(function (val, index) {
                        adCuesPlayed[index] = false;
                    })
                }

                lastCue = "";
            });   
        }
    }
}

function pauseOnPlayClick() {
    var btnPlay = document.getElementById("vidplay");
    btnPlay.addEventListener("click", function() {
        stopAudio();
    })
}

function handleADBtnClick(){
    var adBtn = document.getElementById("ADBtn");
    var vid = getVideoPlayer1();
    
    adBtn.addEventListener("click", function () {
        //console.log("ad button clicked");
        if(vid.playing){
            stopAudio();
        }
      });
}

function stopAudio() {
    var audioPlayer = getAudioPlayer()
    var adEnabled = findADEnabled();
    adActive = false;
    if (adEnabled) {
        audioPlayer.pause()
        // audioPlayer.addEventListener('loadedmetadata', function () {
            audioPlayer.currentTime = 0;
            // }, false);
    }
}

function resumeAudio() {
    var adEnabled = findADEnabled();
    var audioPlayer = getAudioPlayer()
    if (adEnabled && audioPlayer.currentTime > 0) {
        audioPlayer.play();
    }
}

function pauseAudio() {
    var audioPlayer = getAudioPlayer()
    var adEnabled = findADEnabled();
    if (adEnabled) {
        audioPlayer.pause()
    }
}

function playAudio() {
    adActive = true;
    var videoPlayer = getVideoPlayer1();
    var audioPlayer = getAudioPlayer()
    var adEnabled = findADEnabled;
    if (adEnabled) {
        videoPlayer.pause();
        audioPlayer.play()
    }
}

function getBtnPlay() {
    return document.getElementById("vidplay");
}

function ADCueRange(initialLastDigitStringToNum, finalQueTimeString, currQue, adCueComparisonArr) {
    var hundredthSecondPlace = Number(currQue.charAt(10)); //00:00:00.0X 
    var deciSecondPlace = initialLastDigitStringToNum; //00:00:00.X0 
    var tensPlace = Number(currQue.charAt(7)); //00:00:0X.00 
    var hundredsPlace = Number(currQue.charAt(6)); //00:00:X0.00 
    var thousandsPlace = Number(currQue.charAt(4)); //00:0X:00.00 
    var tenThousandsPlace = Number(currQue.charAt(3)); //00:X0:00.00 

    if (initialLastDigitStringToNum <= 6) {
        //00:00:00.X0  <= 6
        deciSecondPlace += 3;
        finalQueTimeString = currQue.substring(0, 8) + "." + deciSecondPlace + hundredthSecondPlace;
        return adCueComparisonArr.push(finalQueTimeString);
    } else if (initialLastDigitStringToNum === 7) {
        //00:00:00.X0 === 7
        deciSecondPlace = 0;
        if (tensPlace === 9) {
            tensPlace = 0;
            if (hundredsPlace < 9) {
                hundredsPlace += 1
            } else {
                hundredsPlace = 0
                if (thousandsPlace < 9) {
                    thousandsPlace += 1;
                } else {
                    thousandsPlace = 0;
                    tenThousandsPlace += 1;
                }
            }
        } else {
            tensPlace += 1;
        }
        finalQueTimeString = currQue.substring(0, 3) + tenThousandsPlace + thousandsPlace + ":" + hundredsPlace + tensPlace + "." + deciSecondPlace + hundredthSecondPlace;
        // console.log("Final substring pos1", finalQueTimeString);
        return adCueComparisonArr.push(finalQueTimeString);
    } else if (initialLastDigitStringToNum === 8) {
        //00:00:00.X0 === 8
        deciSecondPlace = 1;
        if (tensPlace === 9) {
            tensPlace = 0;
            if (hundredsPlace < 9) {
                hundredsPlace += 1
            } else {
                hundredsPlace = 0
                if (thousandsPlace < 9) {
                    thousandsPlace += 1;
                } else {
                    thousandsPlace = 0;
                    tenThousandsPlace += 1;
                }
            }
        } else {
            tensPlace += 1;
        }

        finalQueTimeString = currQue.substring(0, 3) + tenThousandsPlace + thousandsPlace + ":" + hundredsPlace + tensPlace + "." + deciSecondPlace + hundredthSecondPlace;
        // console.log("Final substring pos2", finalQueTimeString);
        return adCueComparisonArr.push(finalQueTimeString);
    } else if (initialLastDigitStringToNum === 9) {
        deciSecondPlace = 2;
        if (tensPlace === 9) {
            tensPlace = 0;
            if (hundredsPlace < 9) {
                hundredsPlace += 1
            } else {
                hundredsPlace = 0
                if (thousandsPlace < 9) {
                    thousandsPlace += 1;
                } else {
                    thousandsPlace = 0;
                    tenThousandsPlace += 1;
                }
            }
        } else {
            tensPlace += 1;
        }
        // console.log("initial String Pos2", initialLastDigitStringToNum)
        finalQueTimeString = currQue.substring(0, 3) + tenThousandsPlace + thousandsPlace + ":" + hundredsPlace + tensPlace + "." + deciSecondPlace + hundredthSecondPlace;
        // console.log("Final substring pos2", finalQueTimeString);
        return adCueComparisonArr.push(finalQueTimeString);
    }
}

// watchPlay();
