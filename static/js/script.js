// static/js/script.js
// SteganoSpeech script
document.addEventListener("DOMContentLoaded", () => {
    // Encode section
    const encodeContainer = document.getElementById("encode-container");
    const encodePlaceholder = document.getElementById("encode-placeholder");
    const encodeImageButton = document.getElementById("encode-upload-btn");
    const encodeButton = document.querySelector("#encode-section .space-y-4 button:nth-of-type(1)");
    const downloadButton = document.querySelector("#encode-section .space-y-4 button:nth-of-type(2)");
    const messageInput = document.querySelector("#encode-section input[type='text']");
    const encodeCanvas = document.getElementById("encode-canvas");
    const encodeCtx = encodeCanvas.getContext("2d");


    // Decode section
    const decodeContainer = document.getElementById("decode-container");
    const decodePlaceholder = document.getElementById("decode-placeholder");
    const decodeImageButton = document.getElementById("decode-upload-btn");
    const revealButton = document.querySelector("#decode-section .w-full.bg-primary");
    const decodedMessageArea = document.getElementById("decoded-message-area");
    const decodedMessageDiv = document.querySelector("#decoded-message-area .text-2xl");
    const decodeCanvas = document.getElementById("decode-canvas");
    const decodeCtx = decodeCanvas.getContext("2d");
    const soundBars = document.getElementById("sound-bars");

    // AI Speech Synthesis
    const playButton = document.querySelector("#decode-section .w-20.h-20.bg-white");

    let carrierImage = null;
    let encodedImage = null;

    // Encode functionality
    encodeImageButton.addEventListener("click", () => {
        // Create a file input to select the image
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert("Please select a valid image file.");
                    return;
                }
                carrierImage = file;
                console.log("Carrier image selected:", carrierImage.name);
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Fit precisely
                        encodeCanvas.width = img.width;
                        encodeCanvas.height = img.height;
                        encodeCtx.drawImage(img, 0, 0);

                        // Show canvas and hide placeholder
                        encodeCanvas.classList.remove("hidden");
                        encodePlaceholder.classList.add("hidden");

                        // Style the container to fit the image precisely
                        encodeContainer.classList.remove("p-8", "flex", "items-center", "justify-center", "min-h-[300px]");
                        encodeContainer.classList.add("p-0");

                        // Check capacity
                        const capacity = Math.floor((img.width * img.height * 3) / 8);
                        console.log(`Image capacity: ${capacity} characters.`);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // Encode functionality
    encodeButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (!carrierImage) {
            alert("Please select a carrier image first.");
            return;
        }
        if (!message) {
            alert("Please enter a message to hide.");
            return;
        }

        console.log(`Encoding message into ${carrierImage.name}...`);

        try {
            // Using the local steganography implementation

            // Check capacity before encoding
            const capacity = Math.floor((encodeCanvas.width * encodeCanvas.height * 3) / 8);
            if (message.length > capacity) {
                alert(`Message is too long! (Max: ${capacity} characters)`);
                return;
            }

            const encodedDataUrl = steg.encode(message, encodeCanvas);

            const img = new Image();
            img.onload = () => {
                encodeCtx.clearRect(0, 0, encodeCanvas.width, encodeCanvas.height);
                encodeCtx.drawImage(img, 0, 0);

                // Convert to Blob for download (Lossless PNG)
                const binary = atob(encodedDataUrl.split(',')[1]);
                const array = [];
                for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
                encodedImage = new Blob([new Uint8Array(array)], { type: "image/png" });

                alert("Encoding complete! The image is now ready for download.");
                downloadButton.classList.add("animate-bounce");
                setTimeout(() => downloadButton.classList.remove("animate-bounce"), 2000);
            };
            img.src = encodedDataUrl;
        } catch (error) {
            console.error(error);
            alert("Encoding failed: " + error.message);
        }
    });

    downloadButton.addEventListener("click", () => {
        if (!encodedImage) {
            alert("No encoded image to download. Please encode a message first.");
            return;
        }
        // Create a URL for the blob and trigger download
        const url = URL.createObjectURL(encodedImage);
        const a = document.createElement("a");
        a.href = url;
        a.download = "secret_image.png"; // Ensure .png for lossless
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Decode functionality
    decodeImageButton.addEventListener("click", () => {
        // Create a file input to select the image
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png, image/jpeg";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert("Please select a valid image file.");
                    return;
                }
                let decodeFile = file;
                console.log("Encoded image selected:", decodeFile.name);
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Fit precisely
                        decodeCanvas.width = img.width;
                        decodeCanvas.height = img.height;
                        decodeCtx.drawImage(img, 0, 0);

                        // Show canvas and hide placeholder
                        decodeCanvas.classList.remove("hidden");
                        decodePlaceholder.classList.add("hidden");

                        // Style the container to fit the image precisely
                        decodeContainer.classList.remove("p-8", "flex", "items-center", "justify-center", "min-h-[300px]");
                        decodeContainer.classList.add("p-0");

                        decodedMessageArea.classList.add("hidden");
                        soundBars.classList.add("hidden");
                        playButton.disabled = true;

                        // Set this as the image to be decoded
                        encodedImage = decodeFile;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    revealButton.addEventListener("click", () => {
        if (!encodedImage) {
            alert("Please select an encoded image first.");
            return;
        }

        console.log("Decoding message...");

        try {
            const decodedMessage = steg.decode(decodeCanvas);

            // Clean up the message (steganography.js sometimes adds null characters)
            const cleanedMessage = decodedMessage ? decodedMessage.replace(/\0/g, '').trim() : "";

            if (cleanedMessage) {
                decodedMessageDiv.textContent = cleanedMessage;
                decodedMessageArea.classList.remove("hidden");
                soundBars.classList.remove("hidden");
                playButton.disabled = false;

                // Scroll to result
                decodedMessageArea.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert("No hidden message found in this image.");
                decodedMessageArea.classList.add("hidden");
                soundBars.classList.add("hidden");
                playButton.disabled = true;
            }
        } catch (error) {
            console.error(error);
            alert("Decoding failed: " + error.message);
        }
    });

    // AI Speech Synthesis
    playButton.addEventListener("click", () => {
        const message = decodedMessageDiv.textContent.trim();
        if (!message) {
            alert("No message to synthesize.");
            return;
        }

        if (!('speechSynthesis' in window)) {
            alert("Sorry, your browser doesn't support text to speech.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.onstart = () => {
            playButton.classList.add("scale-110");
            soundBars.querySelectorAll('div').forEach((bar, index) => {
                bar.style.animation = `bounce 0.5s ${index * 0.1}s infinite alternate`;
                bar.style.transformOrigin = "bottom";
            });
        };
        utterance.onend = () => {
            playButton.classList.remove("scale-110");
            soundBars.querySelectorAll('div').forEach(bar => {
                bar.style.animation = "none";
            });
        };

        window.speechSynthesis.speak(utterance);
    });
});