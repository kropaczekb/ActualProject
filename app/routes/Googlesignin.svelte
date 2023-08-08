<script>
  import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
  const provider = new GoogleAuthProvider();
  const auth = getAuth();
  async function googleSignIn() {
    try {
      let result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken
      const user = result.user
    } catch (error) {
          // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    }
  }
</script>

<button on:click={googleSignIn}>Sign in with Google</button>
