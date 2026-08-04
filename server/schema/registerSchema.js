const { z } = require("zod");
const registerSchema = z.object({
  name: z.string().min(3,"minimum three letter").max(50).trim(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8,"minimum 8 characters").max(64).regex(/[A-Z]/,"at least one uppercase").regex(/[a-z]/,"at least one lowercase").regex(/[0-9]/,"at least one number").regex(/[!@#$%^&*]/,"at least one special character"),
});

module.exports = { registerSchema };
