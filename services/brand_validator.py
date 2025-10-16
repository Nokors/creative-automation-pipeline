"""
Brand Validator Service
Validates campaign images against brand guidelines (color scheme, etc.)
"""

from typing import List, Dict, Tuple, Optional
from pathlib import Path
from PIL import Image
import colorsys
from collections import Counter
from config import get_settings

settings = get_settings()


class BrandValidator:
    """Service for validating campaign images against brand guidelines"""
    
    def __init__(self, brand_colors: Optional[List[str]] = None, tolerance: int = 30):
        """
        Initialize brand validator
        
        Args:
            brand_colors: List of brand colors in hex format (e.g., ['#FF5733', '#3498DB'])
            tolerance: Color matching tolerance (0-255), higher = more lenient
        """
        self.brand_colors = brand_colors or settings.brand_colors
        self.tolerance = tolerance
        self.brand_colors_rgb = [self._hex_to_rgb(color) for color in self.brand_colors]
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _rgb_to_hex(self, rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex color"""
        return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])
    
    def _color_distance(self, color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> float:
        """
        Calculate Euclidean distance between two RGB colors
        
        Args:
            color1: First RGB color
            color2: Second RGB color
            
        Returns:
            Distance between colors (0-441)
        """
        return sum((c1 - c2) ** 2 for c1, c2 in zip(color1, color2)) ** 0.5
    
    def _is_brand_color(self, color: Tuple[int, int, int]) -> Tuple[bool, Optional[str]]:
        """
        Check if color matches any brand color within tolerance
        
        Args:
            color: RGB color to check
            
        Returns:
            Tuple of (is_match, closest_brand_color_hex)
        """
        for brand_color in self.brand_colors_rgb:
            distance = self._color_distance(color, brand_color)
            if distance <= self.tolerance:
                return True, self._rgb_to_hex(brand_color)
        return False, None
    
    def _extract_dominant_colors(self, image_path: Path, num_colors: int = 10) -> List[Tuple[Tuple[int, int, int], int]]:
        """
        Extract dominant colors from image
        
        Args:
            image_path: Path to image file
            num_colors: Number of dominant colors to extract
            
        Returns:
            List of (color, count) tuples
        """
        try:
            with Image.open(image_path) as img:
                # Resize for faster processing
                img.thumbnail((200, 200))
                
                # Convert to RGB
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Get all pixels
                pixels = list(img.getdata())
                
                # Filter out very light (whites) and very dark (blacks) colors
                # These are usually backgrounds or shadows, not brand colors
                filtered_pixels = []
                for pixel in pixels:
                    # Calculate brightness (0-255)
                    brightness = sum(pixel) / 3
                    # Keep pixels that are not too dark or too light
                    if 30 < brightness < 225:
                        filtered_pixels.append(pixel)
                
                # Count color occurrences
                if filtered_pixels:
                    color_counts = Counter(filtered_pixels)
                    return color_counts.most_common(num_colors)
                else:
                    # Fallback to all pixels if filtering removed everything
                    color_counts = Counter(pixels)
                    return color_counts.most_common(num_colors)
                    
        except Exception as e:
            raise Exception(f"Failed to extract colors from image: {str(e)}")
    
    def validate_image_colors(self, image_path: Path) -> Dict[str, any]:
        """
        Validate if image uses brand colors
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with validation result:
            {
                "is_compliant": bool,
                "dominant_colors": List[str],  # Hex colors
                "brand_color_matches": List[str],  # Matched brand colors
                "non_brand_colors": List[str],  # Colors that don't match brand
                "compliance_percentage": float,  # 0-100
                "message": str
            }
        """
        if not self.brand_colors:
            return {
                "is_compliant": True,
                "dominant_colors": [],
                "brand_color_matches": [],
                "non_brand_colors": [],
                "compliance_percentage": 100.0,
                "message": "No brand colors configured - validation skipped"
            }
        
        if not image_path.exists():
            return {
                "is_compliant": False,
                "dominant_colors": [],
                "brand_color_matches": [],
                "non_brand_colors": [],
                "compliance_percentage": 0.0,
                "message": f"Image not found: {image_path}"
            }
        
        try:
            # Extract dominant colors
            dominant_colors = self._extract_dominant_colors(image_path)
            
            # Analyze each dominant color
            brand_matches = []
            non_brand_colors = []
            total_pixels = sum(count for _, count in dominant_colors)
            brand_pixels = 0
            
            for color, count in dominant_colors:
                is_brand, brand_color = self._is_brand_color(color)
                color_hex = self._rgb_to_hex(color)
                
                if is_brand:
                    if brand_color not in brand_matches:
                        brand_matches.append(brand_color)
                    brand_pixels += count
                else:
                    non_brand_colors.append(color_hex)
            
            # Calculate compliance percentage
            compliance_percentage = (brand_pixels / total_pixels * 100) if total_pixels > 0 else 0
            
            # Determine if compliant (at least 50% brand colors)
            is_compliant = compliance_percentage >= 50.0
            
            # Build message
            if is_compliant:
                message = f"Image is brand compliant ({compliance_percentage:.1f}% brand colors). Matches: {', '.join(brand_matches)}"
            else:
                message = f"Image may not be brand compliant ({compliance_percentage:.1f}% brand colors). Expected brand colors: {', '.join(self.brand_colors)}"
            
            return {
                "is_compliant": is_compliant,
                "dominant_colors": [self._rgb_to_hex(color) for color, _ in dominant_colors[:5]],
                "brand_color_matches": brand_matches,
                "non_brand_colors": non_brand_colors[:5],  # Limit to top 5
                "compliance_percentage": round(compliance_percentage, 2),
                "message": message
            }
            
        except Exception as e:
            return {
                "is_compliant": False,
                "dominant_colors": [],
                "brand_color_matches": [],
                "non_brand_colors": [],
                "compliance_percentage": 0.0,
                "message": f"Error validating image colors: {str(e)}"
            }
    
    def validate_campaign_image(self, image_path: Path, skip_if_disabled: bool = True) -> Dict[str, any]:
        """
        Validate campaign image against brand guidelines
        
        Args:
            image_path: Path to image file
            skip_if_disabled: Skip validation if brand validation is disabled
            
        Returns:
            Dictionary with validation result
        """
        # Check if brand validation is enabled
        if skip_if_disabled and not settings.enable_brand_validation:
            return {
                "is_compliant": True,
                "dominant_colors": [],
                "brand_color_matches": [],
                "non_brand_colors": [],
                "compliance_percentage": 100.0,
                "message": "Brand validation is disabled",
                "skipped": True
            }
        
        result = self.validate_image_colors(image_path)
        result["skipped"] = False
        return result


# Singleton instance
_brand_validator = None


def get_brand_validator() -> BrandValidator:
    """Get brand validator singleton instance"""
    global _brand_validator
    if _brand_validator is None:
        _brand_validator = BrandValidator()
    return _brand_validator

