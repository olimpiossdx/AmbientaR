import { GeorefSubnav } from "@/components/georeferenciamento/georef-subnav";



export default function GeoreferenciamentoLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  return (

    <div className="flex flex-col">

      <GeorefSubnav />

      <div>{children}</div>

    </div>

  );

}



