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

                role: {
                  type: "string",
                  enum: [
                    "patient",
                    "doctor",
                    "pharmacy",
                    "delivery",
                    "admin",
                  ],
                  example: "patient",
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
      },
    },
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login user",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              required: ["email", "password"],

              properties: {
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
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Login successful",
        },

        401: {
          description: "Invalid credentials",
        },
      },
    },
  },

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
      },
    },
  },

  "/api/v1/users": {
    get: {
      tags: ["Users"],
      summary: "Get all users",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Users retrieved successfully",
        },
      },
    },
  },

  "/api/v1/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get user by ID",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      responses: {
        200: {
          description: "User details",
        },

        404: {
          description: "User not found",
        },
      },
    },

    patch: {
      tags: ["Users"],
      summary: "Update user",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                name: {
                  type: "string",
                },

                phone: {
                  type: "string",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "User updated successfully",
        },
      },
    },

    delete: {
      tags: ["Users"],
      summary: "Delete user",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      responses: {
        200: {
          description: "User deleted successfully",
        },
      },
    },
  },

  "/api/v1/doctors": {
    get: {
      tags: ["Doctors"],
      summary: "Get doctors",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Doctors retrieved successfully",
        },
      },
    },

    post: {
      tags: ["Doctors"],
      summary: "Create doctor profile",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                specialization: {
                  type: "string",
                  example: "Cardiologist",
                },

                qualification: {
                  type: "string",
                  example: "MBBS, MD",
                },

                experienceYears: {
                  type: "integer",
                  example: 10,
                },

                consultationFee: {
                  type: "number",
                  example: 500,
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Doctor created",
        },
      },
    },
  },

  "/api/v1/appointments": {
    get: {
      tags: ["Appointments"],
      summary: "Get appointments",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Appointments retrieved successfully",
        },
      },
    },

    post: {
      tags: ["Appointments"],
      summary: "Create appointment",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                doctorId: {
                  type: "integer",
                  example: 1,
                },

                appointmentDate: {
                  type: "string",
                  format: "date-time",
                },

                reason: {
                  type: "string",
                  example: "Fever and headache",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Appointment created",
        },
      },
    },
  },

  "/api/v1/appointments/{id}": {
    get: {
      tags: ["Appointments"],
      summary: "Get appointment",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      responses: {
        200: {
          description: "Appointment details",
        },
      },
    },

    patch: {
      tags: ["Appointments"],
      summary: "Update appointment status",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                status: {
                  type: "string",
                  example: "confirmed",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Appointment updated",
        },
      },
    },
  },

  "/api/v1/medicines/search": {
    get: {
      tags: ["Medicines"],
      summary: "Search medicines using ABDM Drug Registry",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "q",
          in: "query",
          required: true,
          schema: {
            type: "string",
          },
          example: "paracetamol",
        },

        {
          name: "page",
          in: "query",
          schema: {
            type: "integer",
            default: 0,
          },
        },

        {
          name: "limit",
          in: "query",
          schema: {
            type: "integer",
            default: 20,
          },
        },
      ],

      responses: {
        200: {
          description: "Medicine search results",
        },
      },
    },
  },

  "/api/v1/prescriptions": {
    get: {
      tags: ["Prescriptions"],
      summary: "Get prescriptions",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Prescriptions retrieved",
        },
      },
    },

    post: {
      tags: ["Prescriptions"],
      summary: "Create prescription",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                patientId: {
                  type: "integer",
                  example: 1,
                },

                doctorId: {
                  type: "integer",
                  example: 2,
                },

                appointmentId: {
                  type: "integer",
                  example: 10,
                },

                diagnosis: {
                  type: "string",
                  example: "Viral fever",
                },

                notes: {
                  type: "string",
                  example: "Take adequate rest and fluids",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Prescription created",
        },
      },
    },
  },

  "/api/v1/orders": {
    get: {
      tags: ["Orders"],
      summary: "Get medicine orders",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Orders retrieved",
        },
      },
    },

    post: {
      tags: ["Orders"],
      summary: "Create medicine order",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                pharmacyId: {
                  type: "integer",
                  example: 1,
                },

                address: {
                  type: "string",
                  example: "Indore, Madhya Pradesh",
                },

                items: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      medicineId: {
                        type: "integer",
                      },

                      quantity: {
                        type: "integer",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Order created",
        },
      },
    },
  },

  "/api/v1/orders/{id}": {
    get: {
      tags: ["Orders"],
      summary: "Get order details",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      responses: {
        200: {
          description: "Order details",
        },
      },
    },

    patch: {
      tags: ["Orders"],
      summary: "Update order status",

      security: [
        {
          bearerAuth: [],
        },
      ],

      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "integer",
          },
        },
      ],

      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                status: {
                  type: "string",
                  example: "processing",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Order updated",
        },
      },
    },
  },

  "/api/v1/deliveries": {
    get: {
      tags: ["Deliveries"],
      summary: "Get deliveries",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Deliveries retrieved",
        },
      },
    },

    post: {
      tags: ["Deliveries"],
      summary: "Create delivery",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                orderId: {
                  type: "integer",
                  example: 1,
                },

                deliveryAddress: {
                  type: "string",
                  example: "Indore, Madhya Pradesh",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Delivery created",
        },
      },
    },
  },

  "/api/v1/payments": {
    get: {
      tags: ["Payments"],
      summary: "Get payments",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Payments retrieved",
        },
      },
    },

    post: {
      tags: ["Payments"],
      summary: "Create payment",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                orderId: {
                  type: "integer",
                  example: 1,
                },

                amount: {
                  type: "number",
                  example: 499,
                },

                method: {
                  type: "string",
                  example: "upi",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Payment created",
        },
      },
    },
  },

  "/api/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Get notifications",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Notifications retrieved",
        },
      },
    },

    post: {
      tags: ["Notifications"],
      summary: "Create notification",

      security: [
        {
          bearerAuth: [],
        },
      ],

      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",

              properties: {
                userId: {
                  type: "integer",
                },

                title: {
                  type: "string",
                },

                message: {
                  type: "string",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description: "Notification created",
        },
      },
    },
  },

  "/api/v1/analytics/dashboard": {
    get: {
      tags: ["Analytics"],
      summary: "Get dashboard analytics",

      security: [
        {
          bearerAuth: [],
        },
      ],

      responses: {
        200: {
          description: "Dashboard analytics",
        },
      },
    },
  },
};