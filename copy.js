function copyCode(button) {

    const text =
        button.parentElement.querySelector("pre").innerText;

    navigator.clipboard.writeText(text);

    button.classList.add("copied");

    const originalText =
        button.innerText;

    button.innerText = "Copied!";

    setTimeout(() => {

        button.innerText = originalText;
        button.classList.remove("copied");

    }, 1500);

}