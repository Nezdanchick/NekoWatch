import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { TextStyle, StyleProp } from 'react-native';

interface GithubIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const GithubIcon: React.FC<GithubIconProps> = ({ size = 24, color = '#000', style }) => {
  return (
    <FontAwesome name="github" size={size} color={color} style={style} />
  );
};

export default GithubIcon;