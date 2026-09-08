const { z } = require("zod");
const loginValidationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(1, "password is required")
    .max(64),
});

module.exports = { loginValidationSchema };
