"use client"

import TrafficLight from '../domain/traffic-light'
import LightConfig, { LightSettings, PresetId, PRESETS } from '../domain/light-config'
import { IconButton, Card, CardActions, CardContent, Stack, Collapse, Typography, Checkbox, Select, MenuItem, RadioGroup, FormControlLabel, Radio, Box, CardActionArea, FormControl, CardHeader, CardMedia } from '@mui/material'
import Grid from '@mui/material/Grid2'
import DeleteIcon from '@mui/icons-material/Delete'
import ShareIcon from '@mui/icons-material/Share'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useState } from 'react'
import { ExpandMore } from './expand-more'
import PhaseControls, { PhaseControl } from './phase-controls'
import LightIcon from './light-icon'
import React from 'react'
import { State } from '../domain/state'
import KeyboardTabIcon from '@mui/icons-material/KeyboardTab'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import EditIcon from '@mui/icons-material/Edit'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import CloseIcon from '@mui/icons-material/Close'
import Slide from '@mui/material/Slide'
import { TransitionProps } from '@mui/material/transitions'
import Timeline from './timeline'
import LightSettingsComponent from './light-settings'

export default function LightComponent({ index, currentTimestamp, light, lightConfig, selected, onLightSettingsChange, onDelete, onSelectionChange, onFullscreen, onShare, quickEditEnabled, toggleQuickEdit }: { index: number, currentTimestamp: number, light: TrafficLight, lightConfig: LightConfig, selected: boolean, onLightSettingsChange: (lightSettings: LightSettings) => void, onDelete?: () => void, onSelectionChange: (b: boolean) => void, onFullscreen: () => void, onShare: () => void, quickEditEnabled: boolean, toggleQuickEdit: () => void }) {

  const [expanded, setExpanded] = useState(false)
  const [selectedState, setSelectedState] = useState(State.RED)
  
  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const deleteButton = onDelete == null ? <></> : <IconButton aria-label="delete" onClick={() => {
    toggleQuickEdit()
    onDelete()
  }}><DeleteIcon /></IconButton>

  const lightIcon = <LightIcon currentTimestamp={currentTimestamp} light={light} lightConfig={lightConfig} height={ expanded ? '150px' : '60px' } />

  const quickEditControls = (
    <PhaseControls
      lightConfig={lightConfig}
      onLightSettingsChange={onLightSettingsChange}
      setSelectedState={setSelectedState}
      selectedState={selectedState}
      expanded={expanded}
    />
  )

  const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<unknown>
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="up" ref={ref} {...props} />
  })

  const handleClose = () => setExpanded(false)

  const editButton = (
    <IconButton 
      disabled={false}
      aria-label="edit" 
      onTouchStart={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    
      onClick={(event) => {
        // Prevent CardActionArea Click
        event.preventDefault()
        handleExpandClick()
      }}
    >
      <EditIcon />
    </IconButton>
  )

  const bottomActions = quickEditEnabled && (
    <CardActions>
      <Box sx={{ ml: 1 }}>
      { quickEditControls }
      </Box>
      <Box style={{marginLeft: 'auto'}}>
        <Button onClick={toggleQuickEdit}>ok</Button>
      </Box>
    </CardActions>
  )

  const theContent = (
    <CardContent>
      <Timeline 
        currentTimestamp={currentTimestamp} 
        lightConfig={lightConfig} 
        onLightSettingsChange={onLightSettingsChange} 
        selectedState={selectedState}
        editable={quickEditEnabled}
      />
    </CardContent>
  ) 

  return (
    <>
      <Card>
        <CardActionArea disabled={false} component="a" onClick={() => setExpanded(!expanded)}>
          <CardActions disableSpacing sx={{ alignItems: 'flex-start' }}>
            <Checkbox 
              value={selected} 
              checked={selected}
              onClick={e => e.stopPropagation()}
              onChange={e => {
                onSelectionChange(e.target.checked)
              }}
              onTouchStart={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            />
            {/* <Box style={{ visibility: 'hidden' }}>{editButton}</Box> to make sure the traffic light is centered */}
            <Box style={{ marginLeft: 'auto' }}>{lightIcon}</Box>
            <Box style={{ marginLeft: 'auto' }}>{editButton}</Box> 
          </CardActions>
        </CardActionArea> 

        { quickEditEnabled ? theContent : <CardActionArea disabled={quickEditEnabled} component="a" onClick={toggleQuickEdit}>{theContent}</CardActionArea> }
        {bottomActions}

      </Card>

      <Dialog
        fullScreen
        open={expanded}
        onClose={handleClose}
        // TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Light Settings
            </Typography>
            <Button autoFocus color="inherit" onClick={handleClose}>
              ok
            </Button>
          </Toolbar>
        </AppBar>
        
        <CardActions>
          <IconButton aria-label="fullscreen" onClick={onFullscreen}><FullscreenIcon /></IconButton>
          <IconButton aria-label="share" onClick={onShare}><ShareIcon /></IconButton>
          { deleteButton }
        </CardActions>

        <Stack spacing={2} sx={{ p: 1, m: 1 }}>
          <Grid container sx={{ justifyContent: "space-between", alignItems: "center" }} spacing={0}>
            <Grid size={{ xs: 12 }} display="flex" justifyContent="center" alignItems="center">
              {lightIcon}
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
          </Grid>

          <LightSettingsComponent
            lightConfig={lightConfig}
            onLightSettingsChange={onLightSettingsChange}
            setSelectedState={setSelectedState}
            selectedState={selectedState}
          />
        </Stack>
      </Dialog>
    </>
  )
}
