import { NativeSelect } from "@/_components/ui/native-select";

interface PostItemProps {
  data: { id: string; title: string }[];
  onSelectCategory?: (value: string) => void;
  children?: React.ReactNode;
}

const PostItem: React.FC<PostItemProps> = ({ data, onSelectCategory, children }) => {
  return (
    <>
      <NativeSelect onChange={(e) => onSelectCategory?.(e.target.value)}>
        <option value="">Todas as categorias</option>
        {data.map((item) => (
          <option key={item.id} value={item.title}>
            {item.title}
          </option>
        ))}
      </NativeSelect>

      <ul className="list-disc list-inside space-y-1 mt-3 overflow-auto max-h-36">
        {children}
      </ul>
    </>
  );
};

export default PostItem;
