import { Product } from "./types";

export const StorePage: React.FC<{
  products: Product[];
  onAddToCart: (productId: string, price: number) => void;
}> = ({ products, onAddToCart }) => {
  return (
    <div className="store">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

const ProductItem: React.FC<{
  product: Product;
  onAddToCart: (productId: string, price: number) => void;
}> = ({ product, onAddToCart }) => {
  return (
    <div className="product" data-product={`${product.id},${product.price}`}>
      <img
        src={`https://placehold.co/150?text=${product.name.replace(" ", "_")}`}
      />
      <h3>{product.name}</h3>
      <p>IDR {product.price.toLocaleString()}</p>
      <button
        className="add-to-cart"
        onClick={() => onAddToCart(product.id, product.price)}
      >
        Add to cart
      </button>
    </div>
  );
};
