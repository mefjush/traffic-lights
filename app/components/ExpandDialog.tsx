import { IconButton, Dialog, Button, AppBar, Toolbar, Typography, Stack, Select, MenuItem, Box } from '@mui/material'
import { createElement, useRef, useState } from 'react'
import Grid from '@mui/material/Grid2'
import SettingsIcon from '@mui/icons-material/Settings'
import ShareIcon from '@mui/icons-material/Share'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import LightSettingsComponent from './LightSettings'
import Timeline from './Timeline'
import LightConfig, { LightSettings, PresetId, PRESETS, SymbolId, SYMBOLS } from '../domain/LightConfig'
import { State } from '../domain/State'
import LightHead from './LightHead'
import TrafficLight from '../domain/TrafficLight'
import TrafficIcon from '@mui/icons-material/Traffic'
import CircleIcon from '@mui/icons-material/Circle'

export default function ExpandDialog({ open, onClose, onFullscreen, onShare, onLightSettingsChange, lightConfig, currentTimestamp, light }: { open: boolean, onClose: () => void, onFullscreen: () => void, onShare: () => void, onLightSettingsChange: (lightSettings: LightSettings) => void, lightConfig: LightConfig, currentTimestamp: number, light: TrafficLight }) {

  const [selectedState, setSelectedState] = useState(State.RED)
  const lightSettingsSnapshot = useRef(lightConfig.toLightSettings())

  const handleClose = (commit: boolean) => {
    if (!commit) {
      onLightSettingsChange(lightSettingsSnapshot.current)
    }
    onClose()
  }

  const changePreset = (presetId: PresetId) => {
    const supportedStates = PRESETS[presetId].states
    if (!supportedStates.includes(selectedState)) {
      setSelectedState(supportedStates[0])
    }
    onLightSettingsChange(lightConfig.withPreset(presetId))
  }

  const lightHead = (
    <LightHead 
      currentTimestamp={currentTimestamp} 
      light={light} 
      lightConfig={lightConfig}
      height={ open ? '150px' : '60px' } 
    />
  )

  const buttons = (
    <Stack direction='row'>
      <IconButton 
        size='large' 
        aria-label="share" 
        onClick={onShare}
      >
        <ShareIcon />
      </IconButton>

      <IconButton 
        size='large' 
        aria-label="fullscreen" 
        onClick={onFullscreen} 
        edge='end'
      >
        <FullscreenIcon />
      </IconButton>
    </Stack>
  )

  // const isImg = lightConfig.preset.symbolId != SymbolId.NONE
  // const symbol = SYMBOLS[lightConfig.preset.symbolId]

  // const imgScale = 0.7
  // const iconSize = `${imgScale * segmentSize}${heightUnit}`

  // const segmentStates = segments.map(segment => {

  //   const on = currentPhase.stateAttributes().segments.includes(segment)
  //   const inverted = symbol.isInverted(segment)

  //   let icon = <> </>
  //   if (isImg) {
  //     icon = createElement(symbol.getIcon(segment), { 
  //       sx: { 
  //         width: iconSize, 
  //         height: iconSize, 
  //         color: inverted ? 'black' : `${segment}.main`, 
  //         opacity: on ? 1 : 0.1 
  //       }
  //     })
  //   }

  const generatePresetMenuItems = () => {
    return Object.values(PRESETS).map(preset => {
      const icon = preset.symbolId != SymbolId.NONE ? SYMBOLS[preset.symbolId].icon : CircleIcon
      const iconElement = createElement(icon, {})
      return (
        <MenuItem 
          key={preset.presetId} 
          value={preset.presetId}
        >
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            {iconElement}
            <span>{preset.name}</span>
          </Stack>
        </MenuItem>
      )
    })
  }

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={() => handleClose(false)}
    >
      <AppBar className="mui-fixed">
        <Toolbar>
          <IconButton 
            size="large" 
            edge="start" 
            color='inherit' 
          >
            <TrafficIcon />
          </IconButton>

          <Typography sx={{ flex: 1 }} variant="h6" component="div">
            Traffic Light
          </Typography>

          <Button color='inherit' onClick={() => handleClose(false)}>Cancel</Button>
          <Button color='inherit' onClick={() => handleClose(true)}>Save</Button>
        </Toolbar>
      </AppBar>
      <Toolbar />

      <Stack spacing={2} sx={{ p: 3 }}>
        <Grid container sx={{ justifyContent: "space-between", alignItems: "center" }} spacing={2}>
          <Grid size={{xs: 12, md: 4, lg: 3}}>
            <Typography gutterBottom>
              Preset
            </Typography>
            <Select 
              fullWidth 
              size='small' 
              value={lightConfig.preset.presetId} 
              onChange={event => changePreset(event.target.value as PresetId)}
            >
              { generatePresetMenuItems() }
            </Select>
          </Grid>

          <Grid size={{ xs: 12 }} display="flex" justifyContent="center" alignItems='flex-start'>
            <Box sx={{ visibility: 'hidden' }}>{buttons}</Box>
            <Box sx={{ flex: 1 }}></Box>
            {lightHead}
            <Box sx={{ flex: 1 }}></Box>
            {buttons}
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Timeline 
              currentTimestamp={currentTimestamp} 
              lightConfig={lightConfig} 
              onLightSettingsChange={onLightSettingsChange} 
              selectedState={selectedState}
              editable={true}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <LightSettingsComponent
              lightConfig={lightConfig}
              onLightSettingsChange={onLightSettingsChange}
              setSelectedState={setSelectedState}
              selectedState={selectedState}
            />
          </Grid>

        </Grid>
      </Stack>
    </Dialog>
  )
}
