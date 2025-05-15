export enum DependencyType {
  REQUIRES = "requires",
  EXCLUDES = "excludes"
}

export interface OptionDependency {
  id: number;
  option_id: number;
  depends_on_option_id: number;
  type: DependencyType;
}

export interface ConditionalPrice {
  id: number;
  option_id: number;
  condition_option_id: number;
  conditional_price: number;
}

export interface PartOption {
  id: number;
  name: string;
  base_price: number;
  in_stock?: boolean;
  part_type_id?: number;
  is_compatible?: boolean;
  available_for_selection?: boolean;
  availability_reason?: string;
  dependencies?: OptionDependency[];
  conditional_prices?: ConditionalPrice[];
}

export interface PartType {
  id: number;
  name: string;
  product_id?: number;
  options: PartOption[];
}

export interface Product {
  id: number;
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  image: string;
  image_url?: string;
  is_active?: boolean;
  featured?: boolean;
  partTypes: PartType[];
}

// Interface for available options for a specific product
export interface AvailableOption {
  id: number;
  name: string;
  base_price: number;
  is_compatible: boolean;
  available_for_selection?: boolean;
  selected?: boolean;
  availability_reason?: string;
}

export interface AvailablePartType {
  id: number;
  name: string;
  options: AvailableOption[];
}

// Interface for add to cart request
export interface AddToCartRequest {
  product_id: number;
  selected_options: number[];
  quantity: number;
} 