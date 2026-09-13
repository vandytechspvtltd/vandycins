export const swaggerPaths = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Check API health",
      responses: {
        200: {
          description: "API is running",
        },
      },
    },
  },

  // ============================================================
  // AUTH - SEND OTP
  // ============================================================
  "/api/v1/auth/send-otp": {
    post: {
      tags: ["Auth"],
      summary: "Send OTP",
      description:
        "Send a development OTP to the user's phone number. Development OTP is 123456.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["phone", "role"],

              properties: {
                phone: {
                  type: "string",
                  example: "5558888888",
                  description: "10-digit mobile phone number",
                },

                role: {
                  type: "string",
                  enum: [
                    "PATIENT",
                    "DOCTOR",
                    "PHARMACY",
                    "DELIVERY",
                  ],
                  example: "PATIENT",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "OTP sent successfully",
        },

        400: {
          description: "Invalid phone number or role",
        },
      },
    },
  },

  // ============================================================
  // AUTH - REGISTER
  // ============================================================
  "/api/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["name", "email", "password", "role"],

              properties: {
                name: {
                  type: "string",
                  example: "John Doe",
                },

                email: {
                  type: "string",
                  format: "email",
                  example: "john@example.com",
                },

                password: {
                  type: "string",
                  format: "password",
                  example: "Password@123",
                },

                phone: {
                  type: "string",
                  example: "5558888888",
                },

                role: {
                  type: "string",
                  enum: [
                    "PATIENT",
                    "DOCTOR",
                    "PHARMACY",
                    "DELIVERY",
                  ],
                  example: "PATIENT",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "User registered successfully",
        },

        400: {
          description: "Invalid request",
        },

        409: {
          description: "Email already registered",
        },
      },
    },
  },

  // ============================================================
  // AUTH - LOGIN WITH OTP
  // ============================================================
  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login user with phone and OTP",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["phone", "otp", "role"],

              properties: {
                phone: {
                  type: "string",
                  example: "5558888888",
                  description: "10-digit mobile phone number",
                },

                otp: {
                  type: "string",
                  example: "123456",
                  description: "One-time password",
                },

                role: {
                  type: "string",
                  enum: [
                    "PATIENT",
                    "DOCTOR",
                    "PHARMACY",
                    "DELIVERY",
                  ],
                  example: "PATIENT",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Login successful",
        },

        400: {
          description: "Phone and OTP are required",
        },

        401: {
          description: "Invalid or expired OTP",
        },

        403: {
          description: "Account inactive or role mismatch",
        },
      },
    },
  },

  // ============================================================
  // AUTH - CURRENT USER
  // ============================================================
  "/api/v1/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get logged-in user",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Current user details",
        },

        401: {
          description: "Unauthorized",
        },

        404: {
          description: "User not found",
        },
      },
    },
  },

  // ... yahan se tumhara existing baaki swaggerPaths
  // /api/v1/users onwards same rahega
};