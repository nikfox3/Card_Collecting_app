import { useState, useEffect, useRef } from 'react'

export const useGyroscope = () => {
  const [orientation, setOrientation] = useState({ 
    alpha: 0, 
    beta: 0, 
    gamma: 0 
  })
  const [isSupported, setIsSupported] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const animationFrameRef = useRef()

  useEffect(() => {
    // Check if device orientation is supported
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      setIsSupported(true)
      
      // Request permission for iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              setIsPermissionGranted(true)
              setupOrientationListener()
            }
          })
          .catch(console.error)
      } else {
        // For older browsers and Android
        setIsPermissionGranted(true)
        setupOrientationListener()
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  const setupOrientationListener = () => {
    window.addEventListener('deviceorientation', handleOrientation, true)
  }

  const handleOrientation = (event) => {
    animationFrameRef.current = requestAnimationFrame(() => {
      setOrientation({
        alpha: event.alpha || 0, // Z-axis rotation (0-360)
        beta: event.beta || 0,   // X-axis rotation (-180 to 180)
        gamma: event.gamma || 0  // Y-axis rotation (-90 to 90)
      })
    })
  }

  // Request permission manually (useful for user interaction)
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission()
        if (response === 'granted') {
          setIsPermissionGranted(true)
          setupOrientationListener()
          return true
        }
      } catch (error) {
        console.error('Permission request failed:', error)
      }
    }
    return false
  }

  // Calculate tilt values for 3D effect - Enhanced for realistic movement
  const getTiltValues = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    
    // Different settings for mobile vs desktop
    const maxTilt = isMobile ? 15 : 25 // Much more subtle on mobile
    const damping = isMobile ? 0.7 : 0.85 // More damping on mobile
    const sensitivity = isMobile ? 0.3 : 0.6 // Reduced sensitivity on mobile
    
    // More realistic tilt calculations with mobile-specific adjustments
    const tiltX = Math.max(-maxTilt, Math.min(maxTilt, orientation.gamma * sensitivity))
    const tiltY = Math.max(-maxTilt, Math.min(maxTilt, orientation.beta * sensitivity))
    
    // Add perspective and depth calculations
    const perspective = isMobile ? 1000 : 1200 // Reduced perspective on mobile
    const depth = Math.abs(tiltX) + Math.abs(tiltY)
    const scale = isMobile ? 1 + (depth * 0.005) : 1 + (depth * 0.01) // Minimal scale on mobile
    
    // Calculate light position based on tilt (for holographic effects)
    const lightX = 50 + (tiltX * (isMobile ? 1.0 : 1.5)) // Reduced light movement on mobile
    const lightY = 50 + (tiltY * (isMobile ? 1.0 : 1.5))
    
    return {
      rotateX: tiltY * damping,
      rotateY: -tiltX * damping,
      translateX: tiltX * (isMobile ? 0.2 : 0.5), // Much less translation on mobile
      translateY: tiltY * (isMobile ? 0.1 : 0.3),
      perspective: perspective,
      scale: scale,
      lightX: Math.max(0, Math.min(100, lightX)),
      lightY: Math.max(0, Math.min(100, lightY)),
      intensity: Math.min(1, depth / maxTilt), // Light intensity based on tilt
      isMobile: isMobile
    }
  }

  return {
    orientation,
    isSupported,
    isPermissionGranted,
    requestPermission,
    getTiltValues
  }
}
