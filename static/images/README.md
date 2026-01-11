# Static Images Directory

Place your image assets here.

## About Page Hero Image

The about page currently uses a placeholder. To add a hero image:

1. Add your image to this directory (e.g., `hero.jpg`)
2. Update `templates/about.html` line ~571:

```html
<img src="{{ url_for('static', filename='images/hero.jpg') }}" alt="Grandparent with granddaughter">
```

## Recommended Image Specifications

- **Format**: JPG or PNG
- **Dimensions**: 600x400px minimum (landscape)
- **Size**: Under 500KB for fast loading
- **Content**: Professional, relevant to scam prevention

## Other Assets

You can add logos, icons, or other images here and reference them using:

```html
<img src="{{ url_for('static', filename='images/your-image.png') }}" alt="Description">
```

Or in CSS:

```css
background-image: url('/static/images/your-image.png');
```
