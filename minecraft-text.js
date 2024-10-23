class MinecraftText extends HTMLElement {
  constructor() {
    super();
    this.defaultStyle = {
      color: "black",
      bold: false,
      italic: false,
      underlined: false,
      strikethrough: false,
      obfuscated: false,
      font: "MinecraftSeven",
    };
    this.lastStyle = { ...this.defaultStyle };
    this.attachShadow({ mode: "open" });
    this.text = {};
    this.currentText = {};
    this.obfuscateInterval = null;
    this.COLOR_LOOKUP = {
      black: "#000000",
      dark_blue: "#0000AA",
      dark_green: "#00AA00",
      dark_aqua: "#00AAAA",
      dark_red: "#AA0000",
      dark_purple: "#AA00AA",
      gold: "#FFAA00",
      gray: "#AAAAAA",
      dark_gray: "#555555",
      blue: "#5555FF",
      green: "#55FF55",
      aqua: "#55FFFF",
      red: "#FF5555",
      light_purple: "#FF55FF",
      yellow: "#FFFF55",
      white: "#FFFFFF",
    };
    this.fallbackColor = "#000000";
  }

  updateLastStyles() {
    for (let style in this.defaultStyle) {
      this.lastStyle[style] =
        this.currentText[style] != null
          ? this.currentText[style]
          : this.lastStyle[style];
    }
  }

  applyStyles(element) {
    let color = "";

    // If the color starts with a '#' signifying that its a hex code but its length isn't 7 then use the fallback color
    // If the color is a word but isn't in the color lookup table then use the fallback color
    // If the color is a word but and is in the color lookup table then use the color in the lookup table
    // If the color is a hex code then use the hex code
    if (
      (this.lastStyle.color.startsWith("#") &&
        this.lastStyle.color.length != 7) ||
      (!this.lastStyle.color.startsWith("#") &&
        !this.COLOR_LOOKUP.hasOwnProperty(this.lastStyle.color))
    )
      color = this.fallbackColor;
    else if (!this.lastStyle.color.startsWith("#"))
      color = this.COLOR_LOOKUP[this.lastStyle.color];
    else color = this.lastStyle.color;

    element.style.color = color;
    element.style.fontWeight = this.lastStyle.bold ? "bold" : "normal";
    element.style.fontStyle = this.lastStyle.italic ? "italic" : "normal";
    element.style.fontFamily = this.lastStyle.font;
    element.style.textDecoration = this.lastStyle.underlined
      ? `underline ${this.lastStyle.color}`
      : "none";
  }

  parseText(rawText) {
    if (rawText == "") return;
    if (rawText[0] == "'")
      return JSON.parse(rawText.substring(1, rawText.length - 1));
    else return JSON.parse(rawText);
  }

  resolveText(text) {
    // [{a}, {b}, {c}] will be converted to {a, extra: [{b}, {c}]}
    let temp = {};

    if (Array.isArray(text)) {
      temp.extra = [];
      for (let entry in text[0]) temp[entry] = text[0][entry];
      for (let i = 1; i < text.length; i++) {
        temp.extra.push(text[i]);
      }
    } else if (typeof text == "object") temp = { ...text };

    this.text = temp;
    console.log(temp);
  }

  generateRandomString(length) {
    const words =
      "'\"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()1234567890_-+=`~[]{}:;,.<>/?";
    let string = "";
    for (let i = 0; i < length; i++)
      string += words[Math.floor(Math.random() * words.length)];
    return string;
  }

  obfuscate() {
    let obfuscatedElements = this.shadowRoot.querySelectorAll(
      "span[is-obfuscated]"
    );

    if (obfuscatedElements.length == 0) return;
    this.obfuscateInterval ??= setInterval(() => this.obfuscate(), 50);

    for (let i = 0; i < obfuscatedElements.length; i++) {
      obfuscatedElements[i].textContent = this.generateRandomString(
        obfuscatedElements[i].textContent.length
      );
    }
  }

  display() {
    const processText = (text) => {
      let span = document.createElement("span");

      this.currentText = { ...text };
      span.textContent = this.currentText.text;

      this.updateLastStyles();
      this.applyStyles(span);

      if (this.currentText.obfuscated)
        span.setAttribute("is-obfuscated", "true");
      this.shadowRoot.appendChild(span);

      // Recursively process extras, if they exist
      if (this.currentText.extra != null) {
        for (let extra of this.currentText.extra) {
          processText(extra); // Recursively call processText for each extra
        }
      }
    };

    // Start the recursive process with the main text object
    processText(this.text);
  }

  connectedCallback() {
    this.resolveText(this.parseText(this.textContent));
    this.display();
    this.obfuscate();
  }
}

customElements.define("minecraft-text", MinecraftText);
