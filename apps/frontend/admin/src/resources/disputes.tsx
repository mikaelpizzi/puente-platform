import {
  List,
  Datagrid,
  TextField,
  DateField,
  Show,
  SimpleShowLayout,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  ShowButton,
  EditButton,
} from 'react-admin';

export const DisputeList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="orderId" label="Pedido" />
      <TextField source="openedBy" label="Abierto por" />
      <TextField source="reason" label="Motivo" />
      <TextField source="status" label="Estado" />
      <DateField source="createdAt" label="Fecha" />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

export const DisputeEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="orderId" disabled />
      <TextInput source="reason" label="Motivo" disabled />
      <SelectInput
        source="status"
        choices={[
          { id: 'OPEN', name: 'Abierta' },
          { id: 'INVESTIGATING', name: 'En Investigación' },
          { id: 'RESOLVED_BUYER', name: 'Resuelta a favor del Comprador' },
          { id: 'RESOLVED_SELLER', name: 'Resuelta a favor del Vendedor' },
          { id: 'CLOSED', name: 'Cerrada' },
        ]}
      />
      <TextInput source="resolution" label="Resolución" multiline rows={4} />
      <TextInput source="adminNotes" label="Notas del Admin" multiline rows={4} />
    </SimpleForm>
  </Edit>
);

export const DisputeShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="orderId" label="ID Pedido" />
      <TextField source="openedBy" label="Abierto por" />
      <TextField source="reason" label="Motivo" />
      <TextField source="description" label="Descripción" />
      <TextField source="status" label="Estado" />
      <TextField source="resolution" label="Resolución" />
      <TextField source="adminNotes" label="Notas del Admin" />
      <DateField source="createdAt" label="Fecha de Apertura" />
      <DateField source="resolvedAt" label="Fecha de Resolución" />
    </SimpleShowLayout>
  </Show>
);
