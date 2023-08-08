<script>
  import { Client, Environment, ApiError, PaymentsApi } from "square"
  import { onMount } from 'svelte';
  import { getFunctions, httpsCallable } from "firebase/functions"


  const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Sandbox,
  });
  console.log(client)

  // client.cardsApi.createCard()
  onMount(async () => {
    const payments = Square.payments('sandbox-sq0idb-AFfdCNUtgbBixzHjM6rX8g', 'LFJYDG89A3JY7');
    const card = await payments.card();
    await card.attach('#card-container');
    const cardButton = document.getElementById('card-button');
    cardButton.addEventListener('click', async () => {
    const statusContainer = document.getElementById('payment-status-container');
    try {
        const result = await card.tokenize();
        if (result.status === 'OK') {
          console.log(`Payment token is ${result.token}`);
          const functions = getFunctions();
          const processPayment = httpsCallable(functions, 'processPayment')
          let paymentResult = await processPayment({ token: result.token })
          const data = JSON.parse(paymentResult.data)
          console.log(data)
          statusContainer.innerHTML = "Payment Successful";
        } else {
          let errorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            errorMessage += ` and errors: ${JSON.stringify(
              result.errors
            )}`;
          }
          throw new Error(errorMessage);
        }
      } catch (e) {
        console.error(e);
        statusContainer.innerHTML = "Payment Failed";
      }
    });
  })
</script>

<div id="payment-status-container"></div>
<div id="card-container"></div>
<button id="card-button" type="button">Pay</button>
