import { Button } from "@/components/ui/button";

export function GuarantorDisplay({ 
  guarantors, 
  onEdit, 
  onRemove 
}) {
  if (guarantors.length === 0) {
    return <p className="text-sm text-gray-500">No guarantors added yet</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {guarantors.map((guarantor, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">Guarantor {index + 1}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Name:</span> {guarantor.name}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">NIC:</span> {guarantor.nic}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Phone:</span> {guarantor.phone}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Occupation:</span> {guarantor.occupation}
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Monthly Income:</span>{" "}
              LKR {Number(guarantor.monthlyIncome).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onEdit(index)}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Edit
            </Button>
            <Button
              onClick={() => onRemove(index)}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}