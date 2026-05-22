import CyanBlur from '../assets/images/cyan-blur.png'
import RedBlur from '../assets/images/red-blur.png'
export default function compStyleOverride(appSettings, radius) {
  const paletteMode = appSettings && appSettings.paletteMode ? appSettings.paletteMode : 'light';
  const AppContrast = appSettings && appSettings.contrast ? appSettings.contrast : 'normal';
  const boxShadowDrawer = paletteMode === 'dark' ? 'rgba(0, 0, 0, 0.24) -40px 40px 80px -8px' : 'rgba(145, 158, 171, 0.24) -40px 40px 80px -8px'

  let paperDrawerColor;
  if (paletteMode === 'dark') {
      paperDrawerColor = AppContrast === 'bold' ? 'rgba(22, 28, 36, 0.9)' : 'rgba(22, 28, 36, 0.9)';
  } else {
      paperDrawerColor = AppContrast === 'bold' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  }

  let paperBoxSadow;
  if (paletteMode === 'dark') {
      paperBoxSadow = AppContrast === 'bold' ? 'rgba(0, 0, 0, 0.16) 0px 1px 2px 0px' : 'rgba(0, 0, 0, 0.2) 0px 0px 2px 0px, rgba(0, 0, 0, 0.12) 0px 12px 24px -4px';
  } else {
      paperBoxSadow = AppContrast === 'bold' ? 'rgba(145, 158, 171, 0.16) 0px 1px 2px 0px' : 'rgba(145, 158, 171, 0.2) 0px 0px 2px 0px, rgba(145, 158, 171, 0.12) 0px 12px 24px -4px';
  }

  return {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        // ── SCROLLBAR ──────────────────────────────────────────────────────
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: paletteMode === 'dark' ? '#161C24' : '#EAECEE',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: paletteMode === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)',
          borderRadius: '4px',
          border: paletteMode === 'dark' ? '2px solid #161C24' : '2px solid #EAECEE',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: paletteMode === 'dark' ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
        },
        // ──────────────────────────────────────────────────────────────────
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
      },
    },
     MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: `${radius}px`
          }
        }
      },
      MuiPaper: {
          defaultProps: {
              elevation: 0
          },
          styleOverrides: {
              root: {
                  backgroundImage: 'none',
                  background: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
                  boxShadow: paperBoxSadow,
              },
              rounded: {
                borderRadius: `${radius}px`
              }
          }
      },
      MuiDrawer: {
          defaultProps: {
              elevation: 0
          },
          width: '100%',
          background: paperDrawerColor,
          backgroundImage: `url(${CyanBlur}), url(${RedBlur})`,
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: 'right top, left bottom',
          backgroundSize: '50%, 50%',
          boxShadow: boxShadowDrawer
          
      },
      MuiCard: {
        styleOverrides: {
          root: {
            position: 'relative',
            zIndex: 0,
          },
        },
      },
      MuiCardHeader: {
        defaultProps: {
          titleTypographyProps: { variant: 'h6' },
          subheaderTypographyProps: { variant: 'body2' },
        },
        styleOverrides: {
          root: {
          },
        },
      },
      // ── TABLE OVERRIDES ─────────────────────────────────────────────────────
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            '& .MuiTableCell-root': {
              backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            '&:nth-of-type(odd)': {
              backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            },
            '&:nth-of-type(even)': {
              backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            },
            '&:hover': {
              backgroundColor: appSettings.paletteMode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: appSettings.paletteMode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.08)',
            },
            '&.Mui-selected:hover': {
              backgroundColor: appSettings.paletteMode === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
          },
        },
      },
      // ── DATAGRID OVERRIDES ────────────────────────────────────────────────
      MuiDataGrid: {
        styleOverrides: {
          root: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            border: 'none',
          },
          row: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            '&:nth-of-type(odd)': {
              backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            },
            '&:nth-of-type(even)': {
              backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
            },
            '&:hover': {
              backgroundColor: appSettings.paletteMode === 'dark'
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: appSettings.paletteMode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.08)',
            },
          },
          columnHeaders: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
          },
          footerContainer: {
            backgroundColor: appSettings.paletteMode === 'dark' ? '#161C24' : '#EAECEE',
          },
        },
      },
      // ────────────────────────────────────────────────────────────────────────
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              border: '1px solid',
              borderColor: 'light-dark(rgb(118, 118, 118), rgb(133, 133, 133))',
              borderRadius:`${radius}px`
            },
            '&:hover $notchedOutline': {
              borderColor: appSettings.paletteMode === 'dark' ? 'white' : 'black',
              borderRadius:`${radius}px`,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: appSettings.paletteMode === 'dark' ? 'white' : 'black',
              borderRadius: `${radius}px`,
            },
            '&.MuiInputBase-multiline': {
              padding: 1
            }
          },
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            '&.Mui-focused': {
              color: appSettings.paletteMode === 'dark' ? 'white' : 'black',
            },
          },
        },
      },
  }
}