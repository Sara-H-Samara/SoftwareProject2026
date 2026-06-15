

export type UserType = 'Artist' | 'Visitor'

export type ArtworkType =
  | 'Painting'
  | 'Sculpture'
  | 'Digital'
  | 'Photography'
  | 'Installation'
  | 'MixedMedia' 
  | 'Drawing' 
  | 'Print' 



export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  userType: UserType
  galleryName: string | null
  bio: string | null
  profilePicUrl: string | null
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiry: string
  user: UserProfile
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  userType: UserType
  galleryName?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  displayName?: string
  galleryName?: string
  bio?: string
}




export interface Artwork3DPlacement {
  positionX: number
  positionY: number
  positionZ: number
  rotationX: number
  rotationY: number
  rotationZ: number
  scaleX: number
  scaleY: number
  scaleZ: number
  
  mountPointId?: string | null;
}


export interface Artwork extends Artwork3DPlacement {
  id: string
  title: string
  description: string | null
  imageUrl: string
  artistId: string
  artistName: string | null
  dimensions: string | null
  materials: string | null
  year: number | null
  price: number | null
  artworkType: ArtworkType
  isPublished: boolean
  createdAt: string
  updatedAt: string
  viewsCount?: number;
  likesCount?: number;
  soldCount?: number;
}

export interface ArtworkSummary {
  id: string
  title: string
  imageUrl: string
  artistName: string | null
  artworkType: ArtworkType
  price: number | null
}


export interface CreateArtworkRequest {
  title: string
  description?: string
  dimensions?: string
  materials?: string
  year?: number
  price?: number
  artworkType: ArtworkType
  positionX?: number
  positionY?: number
  positionZ?: number
  rotationX?: number
  rotationY?: number
  rotationZ?: number
  scaleX?: number
  scaleY?: number
  scaleZ?: number
  mountPointId?: string | null; 
}


export interface UpdateArtworkRequest {
  title?: string
  description?: string
  dimensions?: string
  materials?: string
  year?: number
  price?: number
  artworkType?: ArtworkType
  isPublished?: boolean
  positionX?: number
  positionY?: number
  positionZ?: number
  rotationX?: number
  rotationY?: number
  rotationZ?: number
  scaleX?: number
  scaleY?: number
  scaleZ?: number
  mountPointId?: string | null; 
}


export interface UpdateArtworkPositionRequest extends Artwork3DPlacement { 
  artworkId: string
}



export interface ArtworkPreview {
  id: string
  title: string
  imageUrl: string
}

export interface ArtistGalleryInfo {
  artistId: string
  displayName: string | null
  galleryName: string | null
  bio: string | null
  profilePicUrl: string | null
  artworkCount: number
  featuredArtworks: ArtworkPreview[]
}

export interface GalleryListResponse {
  galleries: ArtistGalleryInfo[]
  totalCount: number
  page: number
  pageSize: number
}



export interface DescriptionPrompt {
  title: string
  artworkType: string
  materials?: string
  additionalContext?: string
}

export interface InspirationPrompt {
  artistBio?: string
  preferredStyle?: string
  numberOfIdeas?: number
}



export interface ApiError {
  error: string
  traceId?: string
}



export interface PaginationParams {
  page: number
  pageSize: number
}



export interface Review {
  id: string;
  artworkId: string;
  artworkTitle: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string | null;
  commentsCount: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string | null;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  repliesCount: number;
  createdAt: string;
  updatedAt: string | null;
  replies: Comment[];
}

export interface CreateReviewRequest {
  artworkId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

export interface CreateCommentRequest {
  artworkId?: string;
  reviewId?: string;
  parentCommentId?: string;
  content: string;
}

export interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export interface FollowResponse {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface ArtistStats {
  artistId: string;
  artistName: string;
  totalArtworks: number;
  totalLikes: number;
  totalFollowers: number;
  averageRating: number;
  totalReviews: number;
  totalViews: number;
  topArtworks: ArtworkStats[];
}

export interface ArtworkStats {
  artworkId: string;
  title: string;
  imageUrl: string;
  likesCount: number;
  viewsCount: number;
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
}



export interface SearchFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  artworkType?: ArtworkType;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'most_liked' | 'top_rated';
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}



export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'review' | 'artwork_published' | 'order_placed'; 
  triggeredByUserId: string | null;
  triggeredByName: string | null;
  entityId: string | null;
  entityTitle: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}



export interface Activity {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'review' | 'artwork_published'; 
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  entityId: string | null;
  entityTitle: string | null;
  entityImage: string | null;
  message: string;
  createdAt: string;
}

export interface ActivityFeedResponse {
  activities: Activity[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}


export interface CartItem {
  artworkId: string;
  title: string;
  imageUrl: string;
  artistName: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CheckoutRequest {
  items: {
    artworkId: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface CheckoutResponse {
  orderId: string;
  totalAmount: number;
  paymentIntentId?: string;
  clientSecret?: string;
}



export interface OrderItem {
  id: string;
  artworkId: string;
  title: string;
  imageUrl: string;
  artistName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  stripeSessionId: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  completedAt: string | null;
  items: OrderItem[];
}



export interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  coverImageUrl: string | null;
  itemCount: number;
  createdAt: string;
  items: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  artworkId: string;
  title: string;
  imageUrl: string;
  artistName: string;
  addedAt: string;
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddToCollectionRequest {
  artworkId: string;
}



export interface MountPoint {
  id: string; 
  position: [number, number, number];
  rotation: [number, number, number]; 
  scale: [number, number, number]; 
  type: 'wall' | 'pedestal' | 'floor_display'; 
  width?: number; 
  height?: number;
  depth?: number;
}



export type HairStyle = 'bald' | 'short' | 'long' | 'curly' | 'ponytail'
export type ShirtStyle = 'tshirt' | 'hoodie' | 'jacket' | 'tank'
export type PantsStyle = 'pants' | 'shorts' | 'skirt'
export type AccessoryStyle =
  | 'none'
  | 'glasses'
  | 'sunglasses'
  | 'hat'
  | 'beanie'
  | 'headphones'
  | 'earrings'
  | 'mask'

export interface Avatar {
  id: string
  userId: string
  skinColor: string
  height: number
  hairStyle: HairStyle
  hairColor: string
  shirtStyle: ShirtStyle
  shirtColor: string
  pantsStyle: PantsStyle
  pantsColor: string
  shoesColor: string
  accessory: AccessoryStyle
  accessoryColor: string
  updatedAt: string
}

export interface UpdateAvatarRequest {
  skinColor?: string
  height?: number
  hairStyle?: HairStyle
  hairColor?: string
  shirtStyle?: ShirtStyle
  shirtColor?: string
  pantsStyle?: PantsStyle
  pantsColor?: string
  shoesColor?: string
  accessory?: AccessoryStyle
  accessoryColor?: string
}