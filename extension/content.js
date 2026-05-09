console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {

    const button = document.createElement('div');

    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';

    button.innerHTML = 'AI Reply';

    button.setAttribute('role', 'button');

    button.setAttribute('data-tooltip', 'Generate AI Reply');

    button.style.cursor = 'pointer';

    return button;
}

function createToneDropdown() {

    const select = document.createElement('select');

    select.className = 'ai-tone-dropdown';

    select.innerHTML = `
        <option value="professional">Professional</option>
        <option value="friendly">Friendly</option>
        <option value="formal">Formal</option>
        <option value="casual">Casual</option>
    `;

    select.style.height = '36px';
    select.style.padding = '0 10px';
    select.style.borderRadius = '6px';
    select.style.border = '1px solid #ccc';
    select.style.backgroundColor = 'white';
    select.style.color = 'black';
    select.style.cursor = 'pointer';
    select.style.fontSize = '14px';

    return select;
}

function getEmailContent() {

    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];

    for (const selector of selectors) {

        const content = document.querySelector(selector);

        if (content) {
            return content.innerText.trim();
        }
    }

    return '';
}

function findComposeToolbar() {

    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];

    for (const selector of selectors) {

        const toolbar = document.querySelector(selector);

        if (toolbar) {
            return toolbar;
        }
    }

    return null;
}

function injectButton() {

    const existingContainer = document.querySelector('.ai-reply-container');

    if (existingContainer) {
        existingContainer.remove();
    }

    const toolbar = findComposeToolbar();

    if (!toolbar) {

        console.log("Toolbar not found");

        return;
    }

    console.log("Toolbar found, creating AI tools");

    const button = createAIButton();

    const toneDropdown = createToneDropdown();

    // Container
    const container = document.createElement('div');

    container.className = 'ai-reply-container';

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.marginRight = '10px';

    container.appendChild(toneDropdown);

    container.appendChild(button);

    // Button Click
    button.addEventListener('click', async () => {

        try {

            button.innerHTML = 'Generating...';

            button.style.pointerEvents = 'none';

            const emailContent = getEmailContent();

            const selectedTone = toneDropdown.value;

            const response = await fetch(
                'http://localhost:8080/api/email/generate',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        emailContent: emailContent,
                        tone: selectedTone
                    })
                }
            );

            if (!response.ok) {

                throw new Error('API Request Failed');
            }

            const generatedReply = await response.text();

            const composeBox = document.querySelector(
                '[role="textbox"][g_editable="true"]'
            );

            if (composeBox) {

                composeBox.focus();

                document.execCommand(
                    'insertText',
                    false,
                    generatedReply
                );

            } else {

                console.error('Compose box not found');
            }

        } catch (error) {

            console.error(error);

            alert('Failed to generate reply');

        } finally {

            button.innerHTML = 'AI Reply';

            button.style.pointerEvents = 'auto';
        }
    });

    // Insert into toolbar
    toolbar.insertBefore(container, toolbar.firstChild);
}

// Observe Gmail compose window
const observer = new MutationObserver((mutations) => {

    for (const mutation of mutations) {

        const addedNodes = Array.from(mutation.addedNodes);

        const hasComposeElements = addedNodes.some(node =>

            node.nodeType === Node.ELEMENT_NODE &&

            (
                node.matches('.aDh, .btC, [role="dialog"]') ||

                node.querySelector('.aDh, .btC, [role="dialog"]')
            )
        );

        if (hasComposeElements) {

            console.log("Compose Window Detected");

            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});