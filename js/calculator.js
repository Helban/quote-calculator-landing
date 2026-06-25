// Klaro quote calculator: computes an estimate client-side and forwards the
// lead to the business inbox. The price is always shown locally; the email
// send is best-effort and configured via a Web3Forms access key.

(() => {
  "use strict";

  const DEBUG = false;

  // Swap this for a real key from https://web3forms.com (free). Left as a
  // placeholder so the demo never posts leads to an unknown inbox.
  const WEB3FORMS_ACCESS_KEY = "REPLACE_WITH_WEB3FORMS_ACCESS_KEY";

  const RATE_PER_SQM = { standard: 4, deep: 8, postbuild: 12 };
  const SERVICE_LABEL = { standard: "Standardowe", deep: "Generalne", postbuild: "Po remoncie" };
  const FREQUENCY_MULTIPLIER = { once: 1.0, biweekly: 0.9, weekly: 0.82 };
  const FREQUENCY_LABEL = { once: "Jednorazowo", biweekly: "Co 2 tygodnie", weekly: "Co tydzień" };
  const ADDON_PRICE = { windows: 60, appliances: 50, upholstery: 90 };
  const ADDON_LABEL = { windows: "Mycie okien", appliances: "AGD wewnątrz", upholstery: "Pranie tapicerki" };
  const MINIMUM_CHARGE = 150;

  const quoteForm = document.getElementById("quote-form");
  const resultPanel = document.getElementById("quote-result");
  const amountOutput = document.getElementById("result-amount");
  const breakdownList = document.getElementById("result-breakdown");
  const statusLine = document.getElementById("result-status");
  const submitButton = document.getElementById("calc-submit");

  const formatZl = (value) => new Intl.NumberFormat("pl-PL").format(Math.round(value));

  /** Validate one field; write the error text and toggle the invalid style. */
  const validateField = (input) => {
    const errorLine = document.getElementById(`${input.id}-error`);
    let message = "";

    if (input.id === "area") {
      const squareMeters = Number(input.value);
      if (!input.value.trim() || Number.isNaN(squareMeters) || squareMeters < 10 || squareMeters > 1000) {
        message = "Podaj metraż od 10 do 1000 m².";
      }
    } else if (input.id === "name") {
      if (!input.value.trim()) message = "Podaj imię.";
    } else if (input.id === "phone") {
      const digitCount = input.value.replace(/\D/g, "").length;
      if (digitCount < 9) message = "Podaj numer telefonu, minimum 9 cyfr.";
    } else if (input.id === "email") {
      if (input.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        message = "Podaj poprawny adres e-mail.";
      }
    }

    input.classList.toggle("invalid", message !== "");
    if (errorLine) errorLine.textContent = message;
    return message === "";
  };

  /** Build the list of priced line items for the chosen options. */
  const computeQuote = (selection) => {
    const ratePerSqm = RATE_PER_SQM[selection.service];
    const baseCleaning = selection.squareMeters * ratePerSqm;
    const multiplier = FREQUENCY_MULTIPLIER[selection.frequency];
    const discount = baseCleaning - baseCleaning * multiplier;

    const lineItems = [
      { label: `${SERVICE_LABEL[selection.service]} (${selection.squareMeters} m² × ${ratePerSqm} zł)`, amount: baseCleaning },
    ];
    if (discount > 0) {
      lineItems.push({ label: `Rabat: ${FREQUENCY_LABEL[selection.frequency].toLowerCase()}`, amount: -discount });
    }
    let runningTotal = baseCleaning - discount;
    for (const addon of selection.addons) {
      lineItems.push({ label: ADDON_LABEL[addon], amount: ADDON_PRICE[addon] });
      runningTotal += ADDON_PRICE[addon];
    }

    let total = runningTotal;
    let minimumApplied = false;
    if (total < MINIMUM_CHARGE) {
      total = MINIMUM_CHARGE;
      minimumApplied = true;
    }
    return { lineItems, total, minimumApplied };
  };

  /** Render the result panel without injecting markup as HTML. */
  const renderResult = (quote) => {
    amountOutput.textContent = formatZl(quote.total);
    breakdownList.replaceChildren();
    for (const lineItem of quote.lineItems) {
      const row = document.createElement("li");
      const labelCell = document.createElement("span");
      labelCell.textContent = lineItem.label;
      const amountCell = document.createElement("span");
      amountCell.textContent = `${lineItem.amount < 0 ? "−" : ""}${formatZl(Math.abs(lineItem.amount))} zł`;
      row.append(labelCell, amountCell);
      breakdownList.append(row);
    }
    resultPanel.hidden = false;
  };

  /** Forward the lead to the business inbox. Returns true only on a real send. */
  const sendLead = async (selection, total) => {
    if (WEB3FORMS_ACCESS_KEY === "REPLACE_WITH_WEB3FORMS_ACCESS_KEY") {
      if (DEBUG) console.warn("Web3Forms access key not set; lead delivery is disabled in this demo.");
      return false;
    }
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `Nowe zgłoszenie sprzątania: ${selection.name}`,
      from_name: "Klaro kalkulator",
      imie: selection.name,
      telefon: selection.phone,
      email: selection.email || "(nie podano)",
      metraz: `${selection.squareMeters} m²`,
      rodzaj: SERVICE_LABEL[selection.service],
      czestotliwosc: FREQUENCY_LABEL[selection.frequency],
      dodatki: selection.addons.map((addon) => ADDON_LABEL[addon]).join(", ") || "brak",
      szacowany_koszt: `${formatZl(total)} zł`,
    };
    const apiResponse = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const apiResult = await apiResponse.json();
    return apiResult.success === true;
  };

  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const inputsToCheck = ["area", "name", "phone", "email"].map((id) => document.getElementById(id));
    const firstInvalid = inputsToCheck.find((input) => !validateField(input));
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const selection = {
      squareMeters: Number(document.getElementById("area").value),
      service: quoteForm.querySelector('input[name="service"]:checked').value,
      frequency: document.getElementById("frequency").value,
      addons: [...quoteForm.querySelectorAll('input[name="addon"]:checked')].map((box) => box.value),
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
    };

    const quote = computeQuote(selection);
    renderResult(quote);
    statusLine.textContent = "Liczymy wycenę i wysyłamy zgłoszenie…";
    submitButton.disabled = true;

    try {
      const delivered = await sendLead(selection, quote.total);
      statusLine.textContent = delivered
        ? "Zgłoszenie do nas dotarło. Oddzwonimy dziś w godzinach pracy."
        : "Wycena gotowa. Aby zamówić termin, zadzwoń lub napisz, dane masz niżej.";
    } catch (networkError) {
      if (DEBUG) console.warn("Lead delivery failed:", networkError);
      statusLine.textContent = "Wycena gotowa, ale wysyłka zgłoszenia się nie powiodła. Zadzwoń, dane masz niżej.";
    } finally {
      submitButton.disabled = false;
    }

    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  for (const id of ["area", "name", "phone", "email"]) {
    document.getElementById(id).addEventListener("blur", (event) => validateField(event.target));
  }
})();
