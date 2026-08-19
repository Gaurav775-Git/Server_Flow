import { useState } from "react";

const DatabaseForm = ({ node, onSave }) => {
  const method = node.data.type;
  const [formData, setFormData] = useState({
    endpoint: "",
    description: "",
  });

  const maxDescriptionLength = 200;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    console.log(formData);
  };
  return (
    <div className=" absolute top-5 right-5 z-50">
      <div className="w-96 bg-red-500 p-6 border-2 border-black rounded-lg shadow-2xl">
        <h2 className="mb-6 text-xl font-semibold">
          Configure {method} Database
        </h2>
        <form
          action=""
          onSubmit={onSubmit}
          className="flex flex-col w-full gap-2"
        >
          <div className=" flex  flex-col ">
            <label htmlFor="endpoint" className="text-black">
              Description
            </label>

            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              maxLength={maxDescriptionLength}
              placeholder="Describe about your schema and type of inputs of your schema of db"
              className="bg-white p-1.5 resize-none "
              required
            />
            <div className="flex justify-end text-xs text-black/60 mt-1">
              {formData.description.length} / {maxDescriptionLength}
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <button
              type="submit"
              className="px-5 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatabaseForm;
