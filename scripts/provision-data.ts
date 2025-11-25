import { URL } from 'url';

const API_URL = 'http://localhost:3000';

const USERS = [
  {
    email: 'maria_vendedora@puente.com',
    password: 'password123',
    role: 'SELLER',
    name: 'Maria Vendedora',
  },
  {
    email: 'luis_repartidor@puente.com',
    password: 'password123',
    role: 'COURIER',
    name: 'Luis Repartidor',
  },
  {
    email: 'carlos_cliente@puente.com',
    password: 'password123',
    role: 'BUYER',
    name: 'Carlos Comprador',
  },
];

const PRODUCTS = [
  {
    name: 'Mochila Wayuu',
    description: 'Mochila artesanal tejida a mano por comunidades indígenas.',
    price: 45.0,
    stock: 100,
    sku: 'MOCH-001',
    vertical: 'fashion',
  },
  {
    name: 'Café Orgánico',
    description: 'Grano entero de altura, tostado medio.',
    price: 12.5,
    stock: 50,
    sku: 'COFFEE-002',
    vertical: 'food',
  },
  {
    name: 'Pulsera Tejida',
    description: 'Pulsera colorida hecha a mano',
    price: 5.0,
    stock: 100,
    sku: 'PULS-003',
    vertical: 'fashion',
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(endpoint: string, method: string, body?: any, token?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle 409 Conflict (User already exists) gracefully
      if (response.status === 409) {
        return { skipped: true, ...data };
      }

      console.error(`\n❌ HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`   Endpoint: ${method} ${url}`);
      console.error(`   Body:`, JSON.stringify(data, null, 2));
      throw new Error(`Request failed with status ${response.status}`);
    }

    return data;
  } catch (error: any) {
    // If it's not the error we just threw
    if (!error.message.includes('Request failed')) {
      console.error(`❌ Network/Fetch Error in ${method} ${url}:`, error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Data Provisioning (Robust Mode)...\n');

  const tokens: Record<string, string> = {};
  const userIds: Record<string, string> = {};

  // 1. Register & Login Users
  console.log('👤 Provisioning Users...');
  for (const user of USERS) {
    try {
      console.log(`   👉 Processing ${user.email}...`);

      // Register
      const regRes = await request('/auth/register', 'POST', {
        email: user.email,
        password: user.password,
        role: user.role,
      });

      if (regRes.skipped) {
        console.log(`      ⚠️ User already exists (Skipping registration).`);
      } else {
        console.log(`      ✅ Registration successful.`);
      }

      // Wait for consistency
      await wait(500);

      // Login
      console.log(`      🔑 Attempting login...`);
      const loginRes = await request('/auth/login', 'POST', {
        email: user.email,
        password: user.password,
      });

      if (loginRes.accessToken) {
        tokens[user.email] = loginRes.accessToken;

        // Decode token to get ID
        try {
          const payload = JSON.parse(atob(loginRes.accessToken.split('.')[1]));
          userIds[user.email] = payload.sub;
          console.log(`      ✅ Login successful (ID: ${payload.sub})`);
        } catch (e) {
          console.error(`      ❌ Failed to decode token for ${user.email}`);
        }
      } else {
        console.error(`      ❌ Login response missing accessToken`);
      }
    } catch (error) {
      console.error(`      ❌ Failed to provision ${user.email}. Skipping.`);
    }
  }

  // 2. Create Products (Maria)
  console.log('\n📦 Provisioning Products (Maria)...');
  const mariaToken = tokens['maria_vendedora@puente.com'];

  if (mariaToken) {
    for (const product of PRODUCTS) {
      try {
        await request('/products', 'POST', product, mariaToken);
        console.log(`   ✅ Created product: ${product.name}`);
      } catch (error) {
        console.log(`   ⚠️ Failed to create ${product.name} (check logs above if critical)`);
      }
    }
  } else {
    console.log('   ❌ Maria not logged in (Token missing). Skipping products.');
  }

  // 3. Fund Accounts
  console.log('\n💰 Funding Accounts...');
  const usersToFund = ['carlos_cliente@puente.com', 'maria_vendedora@puente.com'];

  for (const email of usersToFund) {
    const userId = userIds[email];
    const token = tokens[email]; // Use user's own token if needed, or admin/service token if available.
    // Here we use user's token assuming endpoint is accessible or public-ish for dev.

    if (userId) {
      try {
        await request(
          '/finance/dev/fund',
          'POST',
          {
            userId,
            amount: 500.0,
          },
          token,
        );
        console.log(`   ✅ Added $500 to ${email}`);
      } catch (error) {
        console.error(`   ❌ Failed to fund ${email}`);
      }
    } else {
      console.log(`   ⚠️ Skipping funding for ${email} (User ID not found)`);
    }
  }

  console.log('\n✨ Provisioning Complete!');
}

main();
