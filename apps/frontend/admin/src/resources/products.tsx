import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  Show,
  SimpleShowLayout,
  ImageField,
  EditButton,
  ShowButton,
} from 'react-admin';

export const ProductList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" label="Nombre" />
      <TextField source="sellerId" label="Vendedor" />
      <NumberField source="price" label="Precio" options={{ style: 'currency', currency: 'USD' }} />
      <NumberField source="stock" />
      <BooleanField source="isActive" label="Activo" />
      <BooleanField source="isApproved" label="Aprobado" />
      <DateField source="createdAt" />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export const ProductEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" label="Nombre" />
      <TextInput source="description" multiline rows={4} />
      <NumberInput source="price" label="Precio" />
      <NumberInput source="stock" />
      <BooleanInput source="isActive" label="Activo" />
      <BooleanInput source="isApproved" label="Aprobado" />
      <BooleanInput source="isFeatured" label="Destacado" />
    </SimpleForm>
  </Edit>
);

export const ProductShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" label="Nombre" />
      <TextField source="description" />
      <TextField source="sellerId" label="ID Vendedor" />
      <NumberField source="price" label="Precio" options={{ style: 'currency', currency: 'USD' }} />
      <NumberField source="stock" />
      <TextField source="category" label="Categoría" />
      <BooleanField source="isActive" label="Activo" />
      <BooleanField source="isApproved" label="Aprobado" />
      <ImageField source="images" label="Imágenes" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);
