import ProductDetail from "@/components/ProductDetail";

export default async function Page(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  return <ProductDetail id={id} />;
}
