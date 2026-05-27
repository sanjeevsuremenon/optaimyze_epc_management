import VendorGroupMapping from '../../../components/VendorGroupMapping';

export default function VendorGroupMappingPage({ vendorCode }) {
  return (
    <div className="container mx-auto h-screen">
      <VendorGroupMapping vendorCode={vendorCode} />
    </div>
  );
}

export async function getServerSideProps({ params }) {
  return {
    props: {
      vendorCode: params.code
    }
  };
} 