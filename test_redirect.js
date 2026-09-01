const { isRedirectError } = require("next/dist/client/components/redirect-error");
console.log(isRedirectError(new Error("NEXT_REDIRECT")));
