import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  Show,
  SimpleShowLayout,
  BooleanField,
  BooleanInput,
  EditButton,
  ShowButton,
} from 'react-admin';

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isVerified" label="Verificado" />
      <BooleanField source="isActive" label="Activo" />
      <DateField source="createdAt" label="Registro" />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="email" disabled />
      <SelectInput
        source="role"
        choices={[
          { id: 'BUYER', name: 'Comprador' },
          { id: 'SELLER', name: 'Vendedor' },
          { id: 'COURIER', name: 'Repartidor' },
          { id: 'ADMIN', name: 'Admin' },
          { id: 'SUPER_ADMIN', name: 'Super Admin' },
        ]}
      />
      <BooleanInput source="isVerified" label="Verificado" />
      <BooleanInput source="isActive" label="Activo" />
      <BooleanInput source="isBanned" label="Baneado" />
    </SimpleForm>
  </Edit>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isVerified" label="Verificado" />
      <BooleanField source="isActive" label="Activo" />
      <BooleanField source="isBanned" label="Baneado" />
      <DateField source="createdAt" label="Fecha de Registro" />
      <DateField source="updatedAt" label="Última Actualización" />
    </SimpleShowLayout>
  </Show>
);
