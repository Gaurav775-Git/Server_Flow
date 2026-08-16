import HttpForm from "../sections/dashboard/ConfigForms/HttpForm";
const renderConfigForm = ({data}) => {
  if (!selectedNode) return null;
  if (!selectedNode.data.category === "HTTP") return <HttpForm />;
};
