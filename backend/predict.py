#!/usr/bin/env python3
"""
Traffic Congestion Prediction Script
Uses the trained Gradient Boosting model to predict congestion levels
"""

import sys
import pandas as pd
import numpy as np
import joblib
from pathlib import Path


def load_models():
    """Load the trained model and encoders"""
    try:
        # Get the backend directory (where this script is located)
        backend_dir = Path(__file__).parent

        # Load model and encoders from backend directory
        model_path = backend_dir / 'congestion_model.pkl'
        encoders_path = backend_dir / 'encoders.pkl'

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")

        if not encoders_path.exists():
            raise FileNotFoundError(
                f"Encoders file not found: {encoders_path}")

        model = joblib.load(model_path)
        encoders = joblib.load(encoders_path)

        return model, encoders

    except FileNotFoundError as e:
        print(f"Error loading models: {e}", file=sys.stderr)
        sys.exit(1)
    except (IOError, OSError) as e:
        print(f"Error accessing model files: {e}", file=sys.stderr)
        sys.exit(1)


def load_historical_data():
    """Load historical data for feature imputation"""
    try:
        # Try backend directory first, then project root
        backend_dir = Path(__file__).parent
        data_paths = [
            backend_dir / 'Bangalore_Traffic_Pulse.csv',
            backend_dir.parent / 'Bangalore_Traffic_Pulse.csv'
        ]

        for data_path in data_paths:
            if data_path.exists():
                df = pd.read_csv(data_path)
                print(
                    f"Loaded historical data from {data_path} with {len(df)} records", file=sys.stderr)
                return df

        raise FileNotFoundError(
            "Historical data file not found in any expected location")

    except (FileNotFoundError, pd.errors.EmptyDataError) as e:
        print(f"Error loading historical data: {e}", file=sys.stderr)
        return create_dummy_historical_data()
    except (IOError, OSError) as e:
        print(f"Error accessing data file: {e}", file=sys.stderr)
        return create_dummy_historical_data()


def create_dummy_historical_data():
    """Create dummy historical data for feature imputation"""
    dummy_data = {
        'Area Name': ['Indiranagar', 'Koramangala', 'Whitefield'] * 100,
        'Road/Intersection Name': ['100 Feet Road', '5th Block', 'ITPL Main Road'] * 100,
        'Traffic Volume': np.random.normal(1500, 300, 300),
        'Average Speed': np.random.normal(25, 5, 300),
        'Road Capacity Utilization': np.random.normal(75, 15, 300),
        'Incident Reports': np.random.poisson(2, 300),
        'Pedestrian and Cyclist Count': np.random.normal(50, 10, 300)
    }
    return pd.DataFrame(dummy_data)


def predict_congestion(area_name, road_name, weather_conditions, roadwork_activity, prediction_date=None):
    """
    Predict congestion level for given inputs
    """
    try:
        # Load model and encoders
        model, encoders = load_models()

        # Load historical data for feature imputation
        df_hist = load_historical_data()

        # Create input dataframe
        user_input = {
            'Area Name': area_name,
            'Road/Intersection Name': road_name,
            'Weather Conditions': weather_conditions,
            'Roadwork and Construction Activity': roadwork_activity
        }

        df_input = pd.DataFrame([user_input])

        # Encode categorical features
        categorical_columns = ['Area Name', 'Road/Intersection Name',
                               'Weather Conditions', 'Roadwork and Construction Activity']

        for col in categorical_columns:
            if col in encoders:
                le = encoders[col]
                try:
                    # Handle unknown categories
                    if df_input[col].iloc[0] in le.classes_:
                        df_input[col] = le.transform(df_input[col])
                    else:
                        # Use the most frequent class for unknown categories
                        df_input[col] = le.transform([le.classes_[0]])
                except (ValueError, AttributeError) as e:
                    print(
                        f"Warning: Encoding error for {col}: {e}", file=sys.stderr)
                    df_input[col] = 0  # Default value

        # Fill numerical features using historical averages
        numerical_features = ['Traffic Volume', 'Average Speed', 'Road Capacity Utilization',
                              'Incident Reports', 'Pedestrian and Cyclist Count']

        # Try to find similar historical data
        area_encoded = df_input['Area Name'].iloc[0]

        # Use default values if historical data matching fails
        default_values = {
            'Traffic Volume': 1500,
            'Average Speed': 25,
            'Road Capacity Utilization': 75,
            'Incident Reports': 2,
            'Pedestrian and Cyclist Count': 50
        }

        for feature in numerical_features:
            if feature in df_hist.columns:
                # Use historical average for the area/road combination
                mask = True  # Start with all data
                if 'Area Name' in df_hist.columns:
                    try:
                        mask = mask & (df_hist['Area Name'] == area_encoded)
                    except (KeyError, ValueError):
                        pass

                feature_mean = df_hist.loc[mask, feature].mean(
                ) if mask.sum() > 0 else default_values[feature]

                if pd.isna(feature_mean):
                    feature_mean = default_values[feature]

                df_input[feature] = feature_mean
            else:
                df_input[feature] = default_values[feature]

        # Add derived features
        df_input['Speed_to_Volume'] = df_input['Average Speed'] / \
            (df_input['Traffic Volume'] + 1)
        df_input['Incidents_per_Capacity'] = df_input['Incident Reports'] / \
            (df_input['Road Capacity Utilization'] + 1)

        # Add temporal features (using provided date or defaults)
        from datetime import datetime
        if prediction_date:
            try:
                # Parse the provided date string (YYYY-MM-DD format)
                pred_date = datetime.strptime(prediction_date, '%Y-%m-%d')
                print(
                    f"Using provided prediction date: {prediction_date}", file=sys.stderr)
            except ValueError:
                print(
                    f"Invalid date format: {prediction_date}, using current date", file=sys.stderr)
                pred_date = datetime.now()
        else:
            pred_date = datetime.now()
            print(
                f"Using current date: {pred_date.strftime('%Y-%m-%d')}", file=sys.stderr)

        df_input['Day'] = pred_date.day
        df_input['Month'] = pred_date.month
        # Saturday = 5, Sunday = 6
        df_input['Is_Weekend'] = pred_date.weekday() >= 5

        print(
            f"Temporal features - Day: {pred_date.day}, Month: {pred_date.month}, Is_Weekend: {pred_date.weekday() >= 5}", file=sys.stderr)

        # Define feature order (must match training order)
        feature_columns = [
            'Traffic Volume', 'Average Speed', 'Road Capacity Utilization',
            'Incident Reports', 'Pedestrian and Cyclist Count',
            'Area Name', 'Road/Intersection Name', 'Weather Conditions', 'Roadwork and Construction Activity',
            'Day', 'Month', 'Is_Weekend',
            'Speed_to_Volume', 'Incidents_per_Capacity'
        ]

        # Make prediction
        prediction = model.predict(df_input[feature_columns])

        # Return the prediction (ensure it's within reasonable bounds)
        congestion_level = max(0, min(100, float(prediction[0])))
        return congestion_level

    except (ValueError, KeyError, IndexError) as e:
        print(
            f"Prediction error - Data validation failed: {e}", file=sys.stderr)
        return 50.0
    except (IOError, OSError) as e:
        print(f"Prediction error - File access failed: {e}", file=sys.stderr)
        return 50.0
    except RuntimeError as e:
        print(
            f"Prediction error - Model execution failed: {e}", file=sys.stderr)
        return 50.0


def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 5 or len(sys.argv) > 6:
        print(
            "Usage: python predict.py <area_name> <road_name> <weather_conditions> <roadwork_activity> [prediction_date]", file=sys.stderr)
        print(
            "Date format: YYYY-MM-DD (optional, defaults to current date)", file=sys.stderr)
        sys.exit(1)

    area_name = sys.argv[1]
    road_name = sys.argv[2]
    weather_conditions = sys.argv[3]
    roadwork_activity = sys.argv[4]
    prediction_date = sys.argv[5] if len(sys.argv) == 6 else None

    # Make prediction
    prediction = predict_congestion(
        area_name, road_name, weather_conditions, roadwork_activity, prediction_date)

    # Output the prediction
    print(prediction)


if __name__ == "__main__":
    main()
