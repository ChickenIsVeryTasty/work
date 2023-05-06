function findRelevantScript(dataHash) {
    let scripts = document.getElementsByTagName("script");
    let match = null;
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].innerHTML.startsWith(`$(function(){$('.question-part[data-partHash="${dataHash}`)) {
            // NB: the matching length is 63 (or 64)
            match = scripts[i];
            break;
        }
    }
    return match;
}

// Find the data-parthash of a button that has been clicked on.
function getDataPartHash(element) {
    let dataPartHash = element.parentNode.parentNode.parentNode.getAttribute("data-parthash");
    return dataPartHash;
}

// Replaces the VIP modal paywall with the answer image (usually for math), and does some minor restyling.
function displayUnlockedAnswer(answerURL) {
    // It takes a moment to open the popup client-side.
    setTimeout(function() {
        let modal = document.querySelector(".modal-content");

        // Reformat the modal to fit its new content.
        let modalDialog = document.querySelector(".modal-dialog");
        modalDialog.style.maxWidth = "80%";

        // Update the HTML with the solution.
        modal.outerHTML = `
        <div class="modal-content">
            <div class="modal-body">
                <h3 class="modal-title ui-draggable-handle" style="margin-top: -8px; margin-bottom: 8px;">Answer</h3>
                <div id="modal-questions-solution-content" class="resource-content solution-content">
                    <div class="block" data-type="html">
                        <p>
                            <img style="display:block;margin-left:auto;margin-right:auto" src="${answerURL}">
                        </p>
                    </div>
                </div>
            </div>
        </div>
        `
    }, 500)
}

// Sometimes the answer is actual HTML text.
function updateModalHTML(newHTML) {
    // It takes a moment to open the popup client-side.
    setTimeout(function() {
        let modal = document.querySelector(".modal-content");

        // Reformat the modal to fit its new content.
        let modalDialog = document.querySelector(".modal-dialog");
        modalDialog.style.maxWidth = "80%";

        // Update the HTML with the solution.
        modal.innerHTML = `
        <div class="modal-body">
            ${newHTML}
        </div>
        `

        // Refit potentially oversized image.
        document.querySelector(".modal-body").children[0].children[0].style = "max-width: 100%";
    }, 500)
}

// Sets up the main unlocker. This has to be in a separate function, as SME uses SPA architecture.
function setup() {
    // Collect the needed solution buttons.
    let buttons = document.querySelectorAll("button[data-action='solution']");

    // Add an event listener to all relevant buttons.
    buttons.forEach(button => {

        // Remove any existing event listeners from previous page navigation.
        let new_button = button.cloneNode(true);
        button.parentNode.replaceChild(new_button, button);

        new_button.addEventListener("click", function () {
            const matchingHash = getDataPartHash(new_button);

            // Extract the relevant JS file (which contains an answer URL).
            const matchingFile = findRelevantScript(matchingHash);

            // For the solutions returned as HTML.
            let HTMLre = /"body":"(.*)","type":"html"/gm;
            HTMLre = /solution: \[(\{.*\})\]/gm;
            try {
                const potentialHTMLAnswer = HTMLre.exec(matchingFile.innerHTML)[1];
                // console.log(potentialHTMLAnswer);

                let allAnswers = potentialHTMLAnswer.split("},{");

                allAnswers[0] += "}"
                for (var i = 1; i < allAnswers.length - 1; i++) {
                    allAnswers[i] = "{" + allAnswers[i] + "}"
                }

                if (allAnswers.length > 1) {
                    allAnswers[allAnswers.length -1] = "{" + allAnswers[allAnswers.length -1];
                }

                let HTMLPart = ``;

                // There are often multiple chunks.
                allAnswers.forEach(answer => {
                    if (answer[answer.length - 1] === "}" && answer[answer.length - 2] === "}") {
                        answer = answer.slice(answer, answer.length - 1);
                    }
                    let answerPart = JSON.parse(answer).body;
                    HTMLPart += answerPart;
                });

                updateModalHTML(HTMLPart);
            } catch (error) {
                console.log(error);
                // For the solutions returned as images.
                const re = /https:\/\/\S*png/gm;
                const highResAnswerURL = matchingFile.innerHTML.match(re).pop();

                // Update the answer modal.
                displayUnlockedAnswer(highResAnswerURL);
            }
        });
    });
}

(function() {
    'use strict';

    setup()

    var pushState = history.pushState;
    history.pushState = function () {
        pushState.apply(history, arguments);
        setup()
    }
})();
