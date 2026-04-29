// Construction Kit (v3): reusable Slides API batchUpdate recipe fragments.
// The wizard embeds this verbatim in the system prompt so the agent has explicit
// `requests[]` shapes it can clone (substituting {slidePageId}, {objectId},
// {transform}, {colorRgb01}). This is the wizard's value-add over deferring
// to the agent's baked instructions.
export const constructionKit = {
  geometry: {
    page: { widthEmu: 9144000, heightEmu: 5143500, aspect: "16:9" },
    shapeBaseEmu: { width: 3000000, height: 3000000 },
    conversions: { inchToEmu: 914400, cmToEmu: 360000, ptToEmu: 12700 },
    transformNote:
      "Final width = size.width.magnitude * scaleX. Position via translateX/translateY in EMU from top-left. Use unit: 'EMU'.",
  },

  textRecipes: [
    {
      id: "headline-light",
      use: "Standard content slide headline on light background. Inter thin/light, large.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.003921569, green: 0.105882354, blue: 0.34509805 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 28, unit: "PT" },
            bold: false,
            weightedFontFamily: { fontFamily: "Inter", weight: 300 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "headline-dark",
      use: "Standard content slide headline on Navy background. Inter thin/light, large, Sky.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.671, green: 0.906, blue: 1.0 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 28, unit: "PT" },
            bold: false,
            weightedFontFamily: { fontFamily: "Inter", weight: 300 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "subtitle-light",
      use: "Bold UPPERCASE subtitle on light background. Royal.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.024, green: 0.161, blue: 0.827 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 12, unit: "PT" },
            bold: true,
            weightedFontFamily: { fontFamily: "Inter", weight: 700 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "subtitle-dark",
      use: "Bold UPPERCASE subtitle on Navy background. Sky.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.671, green: 0.906, blue: 1.0 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 12, unit: "PT" },
            bold: true,
            weightedFontFamily: { fontFamily: "Inter", weight: 700 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "body-light",
      use: "Body text on light background. Inter regular Navy.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.003921569, green: 0.105882354, blue: 0.34509805 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 11, unit: "PT" },
            bold: false,
            weightedFontFamily: { fontFamily: "Inter", weight: 400 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "body-dark",
      use: "Body text on Navy background. Inter regular White.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 1.0, green: 1.0, blue: 1.0 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 11, unit: "PT" },
            bold: false,
            weightedFontFamily: { fontFamily: "Inter", weight: 400 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "big-number-on-dark",
      use: "Big stat number for dark callouts. Sky bold/extra-bold, very large.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.671, green: 0.906, blue: 1.0 } } },
            fontFamily: "Inter",
            fontSize: { magnitude: 60, unit: "PT" },
            bold: true,
            weightedFontFamily: { fontFamily: "Inter", weight: 700 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
    {
      id: "divider-title-arial",
      use: "Section divider large title in Arial 36pt Navy.",
      request: {
        updateTextStyle: {
          objectId: "{objectId}",
          fields: "foregroundColor,fontFamily,fontSize,bold,weightedFontFamily",
          style: {
            foregroundColor: { opaqueColor: { rgbColor: { red: 0.003921569, green: 0.105882354, blue: 0.34509805 } } },
            fontFamily: "Arial",
            fontSize: { magnitude: 36, unit: "PT" },
            bold: false,
            weightedFontFamily: { fontFamily: "Arial", weight: 400 },
          },
          textRange: { type: "ALL" },
        },
      },
    },
  ],

  shapeRecipes: [
    {
      id: "fullSlideBackground",
      use: "Solid color background covering the entire slide (RECTANGLE, 9144000x5143500 EMU at 0,0). Pass colorRgb01.",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 9144000, unit: "EMU" }, height: { magnitude: 5143500, unit: "EMU" } },
            transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: "EMU" },
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: "{colorRgb01}" }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
    {
      id: "geometricPatternRight",
      use: "Two overlapping semi-transparent diamond/chevron RECTANGLEs occupying the right ~25% of the slide. Use slightly lighter Navy on dark slides, very light gray on light slides. Pass tone='light'|'dark'.",
      shapes: [
        {
          createShape: {
            objectId: "{objectId}-a",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageObjectId: "{slidePageId}",
              size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
              transform: { scaleX: 0.9, scaleY: 1.7, translateX: 6900000, translateY: -200000, unit: "EMU" },
            },
          },
        },
        {
          createShape: {
            objectId: "{objectId}-b",
            shapeType: "RECTANGLE",
            elementProperties: {
              pageObjectId: "{slidePageId}",
              size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
              transform: { scaleX: 0.7, scaleY: 1.5, translateX: 7400000, translateY: 600000, unit: "EMU" },
            },
          },
        },
      ],
      applyFillLight: {
        updateShapeProperties: {
          objectId: "{objectId}-{ab}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.92, green: 0.92, blue: 0.95 } }, alpha: 0.6 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
      applyFillDark: {
        updateShapeProperties: {
          objectId: "{objectId}-{ab}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.05, green: 0.16, blue: 0.42 } }, alpha: 0.6 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
    {
      id: "darkCardBackground",
      use: "Dark Navy ROUND_RECTANGLE container card behind grouped content. Pass size+transform.",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "ROUND_RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline,contentAlignment",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.003921569, green: 0.105882354, blue: 0.34509805 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
            contentAlignment: "MIDDLE",
          },
        },
      },
    },
    {
      id: "royalCalloutBanner",
      use: "Royal-blue rectangular callout banner (right side of stats-callout layout). Holds a big number + description.",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline,contentAlignment",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.024, green: 0.161, blue: 0.827 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
            contentAlignment: "MIDDLE",
          },
        },
      },
    },
    {
      id: "forestStatStrip",
      use: "Forest-green strip across bottom-left for centered-stats-bullets layout.",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline,contentAlignment",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.004, green: 0.286, blue: 0.161 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
            contentAlignment: "MIDDLE",
          },
        },
      },
    },
    {
      id: "skyQuoteCard",
      use: "Light Sky quote card with Forest text and Forest quotation marks (variant 1).",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "ROUND_RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.671, green: 0.906, blue: 1.0 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
    {
      id: "royalQuoteCard",
      use: "Royal blue quote card with white text and white quotation marks (variant 2).",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "ROUND_RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.024, green: 0.161, blue: 0.827 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
    {
      id: "mintQuoteCard",
      use: "Light Mint quote card with Navy text and Navy quotation marks (variant 3).",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "ROUND_RECTANGLE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 3000000, unit: "EMU" }, height: { magnitude: 3000000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.804, green: 0.992, blue: 0.855 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
    {
      id: "headshotEllipse",
      use: "Circular headshot placeholder for full-quote layout. Insert image via createImage with the same transform.",
      createShape: {
        createShape: {
          objectId: "{objectId}",
          shapeType: "ELLIPSE",
          elementProperties: {
            pageObjectId: "{slidePageId}",
            size: { width: { magnitude: 1800000, unit: "EMU" }, height: { magnitude: 1800000, unit: "EMU" } },
            transform: "{transform}",
          },
        },
      },
      applyFill: {
        updateShapeProperties: {
          objectId: "{objectId}",
          fields: "shapeBackgroundFill,outline",
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: { red: 0.024, green: 0.161, blue: 0.827 } }, alpha: 1 } },
            outline: { propertyState: "NOT_RENDERED" },
          },
        },
      },
    },
  ],

  compositeRecipes: [
    {
      id: "titleCoverGradient",
      use: "Approximate the title-cover dark blue radial gradient using overlapping ELLIPSE shapes layered above a Navy fullSlideBackground.",
      steps: [
        "Apply fullSlideBackground with Navy.",
        "Add a large ELLIPSE (size ~6000000 EMU) at translateX=1500000, translateY=1000000 with Royal solidFill alpha 0.55.",
        "Add a smaller ELLIPSE (size ~3500000 EMU) at translateX=2400000, translateY=1700000 with Sky solidFill alpha 0.45.",
        "Add the title TEXT_BOX vertically centered around (translateX=600000, translateY=2100000), then apply headline-light style overridden to white (color 1,1,1) at 44pt thin weight 200.",
        "Add the subtitle TEXT_BOX directly below, apply subtitle-dark style.",
        "Add the speaker info TEXT_BOX bottom-left (translateX=600000, translateY=4500000) with body-dark style at 11pt.",
      ],
    },
    {
      id: "thankYouGradient",
      use: "Variant of titleCoverGradient with the glow centered.",
      steps: [
        "Apply fullSlideBackground with Navy.",
        "Add a large ELLIPSE (size ~6500000 EMU) at translateX=1300000, translateY=600000 with Royal solidFill alpha 0.55.",
        "Add a smaller ELLIPSE (size ~3500000 EMU) at translateX=2800000, translateY=1700000 with Sky solidFill alpha 0.45.",
        "Add the 'Thank You' TEXT_BOX centered at (translateX=2300000, translateY=2000000, size 4500000x900000) with white Inter thin 96pt.",
      ],
    },
    {
      id: "dividerGradient",
      use: "Approximate the section-divider teal/green gradient.",
      steps: [
        "Apply fullSlideBackground with Mint.",
        "Add a RECTANGLE covering the right ~60% of the slide (size 5500000x5143500 EMU at translateX=3700000, translateY=0) with Forest solidFill alpha 1. This creates a hard split; for softer fall-off layer two more RECTANGLEs at intermediate positions with alpha 0.5.",
        "Add the title TEXT_BOX at (translateX=600000, translateY=1700000) and apply divider-title-arial style.",
        "Add the subtitle TEXT_BOX directly below and apply subtitle-light style.",
      ],
    },
  ],
} as const;
