import { Admin, Resource, CustomRoutes } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { authProvider } from './authProvider';

// Resources
import { UserList, UserEdit, UserShow } from './resources/users';
import { ProductList, ProductEdit, ProductShow } from './resources/products';
import { OrderList, OrderShow } from './resources/orders';
import { DisputeList, DisputeShow, DisputeEdit } from './resources/disputes';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GavelIcon from '@mui/icons-material/Gavel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const dataProvider = simpleRestProvider(API_URL);

/**
 * Puente Admin Panel
 *
 * SUPER_ADMIN only access for:
 * - User moderation
 * - Product catalog management
 * - Order monitoring
 * - Dispute resolution
 */
function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} title="Puente Admin" requireAuth>
      <Resource
        name="users"
        list={UserList}
        edit={UserEdit}
        show={UserShow}
        icon={PeopleIcon}
        options={{ label: 'Usuarios' }}
      />
      <Resource
        name="products"
        list={ProductList}
        edit={ProductEdit}
        show={ProductShow}
        icon={InventoryIcon}
        options={{ label: 'Productos' }}
      />
      <Resource
        name="orders"
        list={OrderList}
        show={OrderShow}
        icon={ShoppingCartIcon}
        options={{ label: 'Pedidos' }}
      />
      <Resource
        name="disputes"
        list={DisputeList}
        edit={DisputeEdit}
        show={DisputeShow}
        icon={GavelIcon}
        options={{ label: 'Disputas' }}
      />
    </Admin>
  );
}

export default App;
