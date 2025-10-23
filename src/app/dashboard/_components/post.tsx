interface Post {
  id: string;
  title: string;
  category?: { name: string };
  price: number;
}

interface PostItemProps {
  data: Post[];
  children?: React.ReactNode;
}

const PostItem: React.FC<PostItemProps> = ({ data, children }) => {
  return (
    <ul className="list-disc list-inside space-y-1">
      {data.map((post) => (
        <li key={post.id}>
          {post.title} — {post.category?.name} (${post.price})
        </li>
      ))}
      {children}
    </ul>
  );
};

export default PostItem;
