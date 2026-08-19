import DatabaseForm from "../sections/dashboard/ConfigForms/DatabaseForm";
import HttpForm from "../sections/dashboard/ConfigForms/HttpForm";
const renderConfigForm = ({ data }) => {
  if (!selectedNode) return null;
  if (!selectedNode.data.category === "HTTP") return <HttpForm />;
  if (!selectedNode.data.category === "DATABASE") return <DatabaseForm />;
};
