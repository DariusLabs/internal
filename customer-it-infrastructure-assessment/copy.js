function copyCode(button) {

    const code = button.closest('.code-block').querySelector('pre').innerText;

    navigator.clipboard.writeText(code).then(() => {

        button.innerText = 'Copied!';

        setTimeout(() => {
            button.innerText = 'Copy';
        }, 2000);

    });

}

function copyLink(button) {

    const link = button.closest('.link-block').querySelector('pre').innerText;

    navigator.clipboard.writeText(link).then(() => {

        button.innerText = 'Copied!';

        setTimeout(() => {
            button.innerText = 'Copy';
        }, 2000);

    });

}