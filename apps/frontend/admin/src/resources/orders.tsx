import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Show,
  SimpleShowLayout,
  ShowButton,
  ArrayField,
  SingleFieldList,
  ChipField,
} from 'react-admin';

export const OrderList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="buyerId" label="Comprador" />
      <TextField source="sellerId" label="Vendedor" />
      <TextField source="status" label="Estado" />
      <NumberField
        source="totalAmount"
        label="Total"
        options={{ style: 'currency', currency: 'USD' }}
      />
      <DateField source="createdAt" label="Fecha" />
      <ShowButton />
    </Datagrid>
  </List>
);

export const OrderShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="buyerId" label="ID Comprador" />
      <TextField source="sellerId" label="ID Vendedor" />
      <TextField source="courierId" label="ID Repartidor" />
      <TextField source="status" label="Estado" />
      <NumberField
        source="totalAmount"
        label="Total"
        options={{ style: 'currency', currency: 'USD' }}
      />
      <TextField source="shippingAddress" label="Dirección de Envío" />
      <TextField source="paymentMethod" label="Método de Pago" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <DateField source="deliveredAt" label="Fecha de Entrega" />
    </SimpleShowLayout>
  </Show>
);
