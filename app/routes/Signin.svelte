<script>
  import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

  const auth = getAuth();
  async function handleSubmit(email, password) {
    try {
      let userCredential = await signInWithEmailAndPassword(auth, email, password)
      let user = userCredential.user
      console.log(user)
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorCode, errorMessage)
    }
  }
  let email=''
  let password=''
</script>

<form on:submit|preventDefault={handleSubmit(email, password)}>
  <input bind:value={email}>
  <input bind:value={password}>
  <button type="submit">Sign In</button>
</form>
