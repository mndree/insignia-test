export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Crypto Wallet Offline Assignment API',
    version: '1.0',
    description:
      'REST API with Admin Login and Bearer Token Authorization for Wallet and Transaction management.\n\n' +
      '### How to Authorize in Swagger UI:\n' +
      '1. Go to **Admin API** -> `POST /admin/login`\n' +
      '2. Use username: `admin`, password: `admin123` (or register a new admin)\n' +
      '3. Copy the returned `token`\n' +
      '4. Click the green **Authorize 🔓** button at the top right of this page\n' +
      '5. Paste the token and click **Authorize**\n' +
      '6. All protected routes will now automatically use the Admin Bearer token!',
  },
  servers: [
    { url: '/', description: 'Current Server' }
  ],
  components: {
    securitySchemes: {
      'admin-token': {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Admin Bearer Token from POST /admin/login',
      },
    },
  },
  security: [{ 'admin-token': [] }],
  paths: {
    '/user': {
      post: {
        tags: ['Wallet API'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username'],
                properties: {
                  username: { type: 'string', example: 'alice' },
                  password: { type: 'string', example: 'password123' },
                  fullName: { type: 'string', example: 'Alice Morgan' },
                  email: { type: 'string', example: 'alice@example.com' },
                  phone: { type: 'string', example: '+62 812 3456 7890' },
                  dateOfBirth: { type: 'string', example: '15 May 1996' },
                  address: { type: 'string', example: 'South Jakarta, Indonesia' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '409': { description: 'Username already taken' },
        },
      },
    },
    '/user/check-username/{username}': {
      get: {
        tags: ['Wallet API'],
        summary: 'Check if username is already registered',
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Availability check result' },
        },
      },
    },
    '/topup': {
      post: {
        tags: ['Wallet API'],
        summary: 'Top up user balance',
        security: [{ 'admin-token': [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', example: 100 },
                },
              },
            },
          },
        },
        responses: {
          '204': { description: 'Balance topped up successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/balance': {
      get: {
        tags: ['Wallet API'],
        summary: 'Read current user balance',
        security: [{ 'admin-token': [] }],
        responses: {
          '200': { description: 'Current balance returned' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/transfer': {
      post: {
        tags: ['Wallet API'],
        summary: 'Transfer funds to another user',
        security: [{ 'admin-token': [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to_username', 'amount'],
                properties: {
                  to_username: { type: 'string', example: 'bob' },
                  amount: { type: 'number', example: 25 },
                },
              },
            },
          },
        },
        responses: {
          '204': { description: 'Transfer executed successfully' },
          '400': { description: 'Insufficient balance or invalid recipient' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/top_transactions_per_user': {
      get: {
        tags: ['Wallet API'],
        summary: 'Top transfers for current user sorted by absolute amount',
        security: [{ 'admin-token': [] }],
        responses: {
          '200': { description: 'Top transactions returned' },
        },
      },
    },
    '/top_users': {
      get: {
        tags: ['Wallet API'],
        summary: 'List overall top transacting users by outgoing transfer value',
        security: [{ 'admin-token': [] }],
        responses: {
          '200': { description: 'Top users returned' },
        },
      },
    },
    '/transactions': {
      get: {
        tags: ['Wallet API'],
        summary: 'Fetch paginated transaction history with filtering and search',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'direction', in: 'query', schema: { type: 'string', enum: ['all', 'incoming', 'outgoing'] } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          '200': { description: 'Paginated transactions list' },
        },
      },
    },
    '/admin/login': {
      post: {
        tags: ['Admin API'],
        summary: 'Admin login to receive Admin Bearer Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Admin authenticated successfully' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/admin/register': {
      post: {
        tags: ['Admin API'],
        summary: 'Register a new admin account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin2' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Admin registered successfully' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin API'],
        summary: 'List and search users with wallet balance and metrics',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          '200': { description: 'Users list returned' },
        },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin API'],
        summary: 'Get user details, biodata, balance, and recent transactions',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'User details returned' },
        },
      },
      patch: {
        tags: ['Admin API'],
        summary: 'Update user profile and status',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  dateOfBirth: { type: 'string' },
                  address: { type: 'string' },
                  status: { type: 'string', enum: ['Active', 'Inactive'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User updated successfully' },
        },
      },
    },
    '/admin/users/{id}/transfer': {
      post: {
        tags: ['Admin API'],
        summary: 'Admin initiated transfer from user balance',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to_username', 'amount'],
                properties: {
                  to_username: { type: 'string' },
                  amount: { type: 'number' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Transfer executed successfully' },
        },
      },
    },
    '/admin/change-password': {
      patch: {
        tags: ['Admin API'],
        summary: 'Change password for admin account',
        security: [{ 'admin-token': [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'newPassword'],
                properties: {
                  username: { type: 'string' },
                  newPassword: { type: 'string' },
                  currentPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed successfully' },
        },
      },
    },
    '/admin/profile/{username}': {
      get: {
        tags: ['Admin API'],
        summary: 'Get profile information for admin account',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Profile returned' },
        },
      },
      patch: {
        tags: ['Admin API'],
        summary: 'Update profile information for admin account',
        security: [{ 'admin-token': [] }],
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  dateOfBirth: { type: 'string' },
                  gender: { type: 'string' },
                  address: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated successfully' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth API'],
        summary: 'Login endpoint for users and administrators',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User authenticated successfully' },
        },
      },
    },
  },
};
